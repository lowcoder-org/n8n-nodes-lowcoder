import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
    ILoadOptionsFunctions,
    INodeListSearchResult,
} from 'n8n-workflow';

import {
	OptionsWithUri,
} from 'request';
import { appFields, appOperations } from './AppDescription';
import { apiRequest } from './GenericFunctions';

interface LowcoderAppType {
	applicationId: string;
	name: string;
}

export class Lowcoder implements INodeType {
	description: INodeTypeDescription = {
        displayName: 'Lowcoder',
        name: 'lowcoder',
        // eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
        icon: 'file:lowcoder.png',
        group: ['transform'],
        version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
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
            ...appOperations,
            ...appFields
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
						name: b.name,
						value: b.applicationId,
					})),
				};
			},
		},
	};

	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        let responseData;
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;

        // For each item, make an API call to create a contact
        for (let i = 0; i < items.length; i++) {
            if (resource === 'app') {
                if (operation === 'create') {
                    // Get email input
                    const email = this.getNodeParameter('email', i) as string;
                    // Get additional fields input
                    const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                    const data: IDataObject = {
                        email,
                    };

                    Object.assign(data, additionalFields);

                    // Make HTTP request according to https://sendgrid.com/docs/api-reference/
                    const options: OptionsWithUri = {
                        headers: {
                            'Accept': 'application/json',
                        },
                        method: 'PUT',
                        body: {
                            contacts: [
                                data,
                            ],
                        },
                        uri: `https://api.sendgrid.com/v3/marketing/contacts`,
                        json: true,
                    };
                    responseData = await this.helpers.requestWithAuthentication.call(this, 'friendGridApi', options);
                    returnData.push(responseData);
                }
            }
        }
        // Map data to n8n data structure
        return [this.helpers.returnJsonArray(returnData)];
	}
}