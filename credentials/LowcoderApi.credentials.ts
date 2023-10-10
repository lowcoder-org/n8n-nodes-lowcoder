import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import setCookie from 'set-cookie-parser';

export class LowcoderApi implements ICredentialType {
	name = 'lowcoderApi';
	displayName = 'Lowcoder API';
	properties: INodeProperties[] = [
        {
			displayName: 'Cookie Token',
			name: 'sessionToken',
			type: 'hidden',

			typeOptions: {
				expirable: true,
			},
			default: '',
		},
		{
			displayName: 'API Base URL',
			name: 'url',
			type: 'string',
			default: '',
		},
        {
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

    // method will only be called if "sessionToken" (the expirable property)
	// is empty or is expired
	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		// make reques to get session token
		const url = credentials.url as string;
		const options = {
			method: 'POST',
			url: `${url.endsWith('/') ? url.slice(0, -1) : url}/api/auth/form/login`,
			body: {
				loginId: credentials.username,
				password: credentials.password,
				register: "false",
				source: "EMAIL",
				authId: "EMAIL"
			},
			headers: {
				LOWCODER_CE_SELFHOST_TOKEN: credentials.apiToken
			},
			returnFullResponse: true
		} as IHttpRequestOptions;
		try {
			const request = (await this.helpers.httpRequest(options));
			const tokenCookie = setCookie.parse(request.headers['set-cookie'])
				.filter(cookie => cookie.name === 'LOWCODER_CE_SELFHOST_TOKEN');
			return { sessionToken: tokenCookie[0]?.value };
		} catch (e: any) {
			var error = new Error(e.response.data.message ? e.response.data.message : e.error);
			error.cause = options as any;
			throw error;		
		}
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Cookie': '=LOWCODER_CE_SELFHOST_TOKEN={{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.url}}',
			url: 'api/users/me',
		},
	};
}