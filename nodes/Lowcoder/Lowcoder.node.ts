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
        subtitle: '=app:{{ $parameter["appId"]',
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
                responseMode: 'onReceived',
                responseData: '={{$parameter["options"]["responseData"] || "Workflow Resumed!"}}',
                responseContentType: '={{$parameter["options"]["responseContentType"] || "application/json"}}',
                responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
                responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
                path: '={{$parameter["appId"] || ""}}',
                restartWebhook: true,
            },
        ],
        properties: [
            ...appFields,
            {
                displayName: 'Resume the workflow by calling this Webhook: http(s)://{n8n-url}/webhook-waiting/{Workflow-Execution-ID}/{Lowcoder-App-ID}',
                name: 'webhookNotice',
                type: 'notice',
                default: '',
            },
            {
                displayName: 'The Workflow-Execution-ID is available via the n8n Rest API',
                name: 'webhookNotice',
                type: 'notice',
                default: '',
            },
            httpMethodsProperty,
            optionsProperty,
            {
                displayName: 'Response Code',
                name: 'responseCode',
                type: 'number',
                default: 200,
                description: 'The HTTP response code to return',
            },
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
                console.log(searchResults);
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
            responseCode?: number;
        };
        const req = this.getRequestObject();
        const resp = this.getResponseObject();

        try {
            if (options.ignoreBots && isbot(req.headers['user-agent'])) {
                throw new NodeApiError(this.getNode(), {}, { message: 'Authorization data is wrong!' });
            }
        } catch (error) {
            resp.writeHead(error.responseCode || 401, { 'WWW-Authenticate': 'Basic realm="Webhook"' });
            resp.end(error.message);
            return { noWebhookResponse: true };
        }

        const type = req.query.type;
        if (type === 'resume') {
            // Resume workflow as before
            const body = typeof req.body != 'undefined' ? req.body : {};
            const returnItem: INodeExecutionData = {
                binary: {},
                json: {
                    headers: req.headers,
                    params: req.params,
                    query: req.query,
                    body: body,
                },
            };
            const responseCode = options.responseCode || 200;
            resp.statusCode = responseCode;
            return { workflowData: [[returnItem]] };
        } else {
            // Return input data, and don't resume
            const staticData = this.getWorkflowStaticData('node');
            const previousData = staticData.previousNodeData || [];
            resp.statusCode = 200;
            resp.setHeader('Content-Type', 'application/json');
            resp.end(JSON.stringify({ message: 'Static response: workflow not resumed', type, previousData }));
            return { noWebhookResponse: true };
        }
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        let waitTill = new Date(WAIT_TIME_UNLIMITED);
        const staticData = this.getWorkflowStaticData('node');
        staticData.previousNodeData = this.getInputData().map(item => item.json);
        await this.putExecutionToWait(waitTill);
        return [this.getInputData()];
    }
}