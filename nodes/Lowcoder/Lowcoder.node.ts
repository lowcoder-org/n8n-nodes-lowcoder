

import {
	INodeType,
	INodeTypeDescription,
    ILoadOptionsFunctions,
    INodeListSearchResult,
    IExecuteFunctions,
    INodeExecutionData,
    IWebhookFunctions,
    IWebhookResponseData,
    NodeApiError,
} from 'n8n-workflow';

import { appFields, httpMethodsProperty, optionsProperty } from './AppDescription';
import { apiRequest } from './GenericFunctions';
import isbot from 'isbot';

interface LowcoderAppType {
	applicationId: string;
	name: string;
    applicationType: number
}

const WAIT_TIME_UNLIMITED = '3000-01-01T00:00:00.000Z';

export class Lowcoder implements INodeType {
	description: INodeTypeDescription = {
        displayName: 'Lowcoder',
        name: 'lowcoder',
        // eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
        icon: 'file:lowcoder.png',
        group: ['transform'],
        version: 1,
		subtitle: '={{$parameter["resource"] }}:{{ $parameter["appId"]',
        description: 'Consume Lowcoder API',
        defaults: {
            name: 'Lowcoder',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'lowcoderApi',
                required: true,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: '={{$parameter["httpMethod"]}}',
                isFullPath: true,
                responseCode: '200',
                responseMode: 'onReceived',
                responseData: 'allEntries',
                responseContentType: '={{$parameter["options"]["responseContentType"]}}',
                responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
                responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
                path: '={{$parameter["appId"] || ""}}',
				restartWebhook: true,
            },
		],
        properties: [
            {
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'App',
						value: 'app',
					}
				],
				default: 'app',
			},
            ...appFields,
            {
				displayName:
					'The webhook URL will be generated at run time. It can be referenced with the <strong>$execution.resumeUrl</strong> variable. Send it somewhere before getting to this node. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait" target="_blank">More info</a>',
				name: 'webhookNotice',
				type: 'notice',
				default: '',
			},
            httpMethodsProperty,
            optionsProperty
        ],
	};

    methods = {
		listSearch: {
			async searchApps(
				this: ILoadOptionsFunctions,
				query?: string,
			): Promise<INodeListSearchResult> {
				
				const searchResults = await apiRequest.call(
					this,
					'GET',
					'applications/list',
					{},
					{
						query,
                        withContainerSize: false
					},
				);

				return {
					results: searchResults.data.map((b: LowcoderAppType) => ({
						name: `${b.name} (${b.applicationType == 2 ? "Module" : "App"})`,
						value: b.applicationId,
					})),
				};
			},
		},
	};

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const options = this.getNodeParameter('options', {}) as {
			binaryData: boolean;
			ignoreBots: boolean;
			rawBody: Buffer;
			responseData?: string;
		};
		const req = this.getRequestObject();
		const resp = this.getResponseObject();

		try {
			if (options.ignoreBots && isbot(req.headers['user-agent'])) {
				throw new NodeApiError(this.getNode(), {}, { message: 'Authorization data is wrong!' });
            }
		} catch (error) {
            resp.writeHead(error.responseCode, { 'WWW-Authenticate': 'Basic realm="Webhook"' });
            resp.end(error.message);
            return { noWebhookResponse: true };
		}
        // const { data } = req.body;

        const returnItem: INodeExecutionData = {
            binary: {},
            json: {
                headers: req.headers,
                params: req.params,
                query: req.query,
                // body: data,
            },
        };
        return { workflowData: [[returnItem]] };
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

        let waitTill = new Date(WAIT_TIME_UNLIMITED);

        await this.putExecutionToWait(waitTill);
		return [this.getInputData()];
	}
}