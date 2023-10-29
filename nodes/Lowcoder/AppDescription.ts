import type { INodeProperties } from 'n8n-workflow';

export const appFields: INodeProperties[] = [
	// ----------------------------------
	//         app:create
	// ----------------------------------
	{
		displayName: 'Select App or Module',
		name: 'appId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select an App...',
				typeOptions: {
					searchListMethod: 'searchApps',
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '[a-zA-Z0-9]{2,}',
							errorMessage: 'Not a valid Lowcoder App ID',
						},
					},
				],
				placeholder: '65129e728953c27f7d15b64d',
			},
		],
		description: 'The ID of the app',
	}
];

export const httpMethodsProperty: INodeProperties = {
	displayName: 'Webhook HTTP Method',
	name: 'httpMethod',
	type: 'options',
	options: [
		{
			name: 'DELETE',
			value: 'DELETE',
		},
		{
			name: 'GET',
			value: 'GET',
		},
		{
			name: 'HEAD',
			value: 'HEAD',
		},
		{
			name: 'PATCH',
			value: 'PATCH',
		},
		{
			name: 'POST',
			value: 'POST',
		},
		{
			name: 'PUT',
			value: 'PUT',
		},
	],
	default: 'GET',
	description: 'The HTTP method to listen to',
};

export const optionsProperty: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	options: [
		{
			displayName: 'Ignore Bots',
			name: 'ignoreBots',
			type: 'boolean',
			default: false,
			description: 'Whether to ignore requests from bots like link previewers and web crawlers',
		}
	],
};