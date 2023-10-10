import type { INodeProperties } from 'n8n-workflow';

export const appOperations: INodeProperties[] = [
	// ----------------------------------
	//         app
	// ----------------------------------
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['app'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new app',
				action: 'Create a app',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a app',
				action: 'Delete a app',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get the data of a app',
				action: 'Get a app',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a app',
				action: 'Update a app',
			},
		],
		default: 'create',
	},
];

export const appFields: INodeProperties[] = [
	// ----------------------------------
	//         app:create
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		placeholder: 'My app',
		required: true,
		displayOptions: {
			show: {
				operation: ['create'],
				resource: ['app'],
			},
		},
		description: 'The name of the app',
	},
	{
		displayName: 'App',
		name: 'id',
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
				displayName: 'By Name',
				name: 'name',
				type: 'string',
				placeholder: 'name@example.tld\'s new app'
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
		displayOptions: {
			show: {
				operation: ['get', 'delete', 'update'],
				resource: ['app'],
			},
		},
		description: 'The ID of the app',
	}
];