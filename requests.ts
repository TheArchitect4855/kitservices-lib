import { browser } from "$app/environment";

let defaultApi: string = 'https://api.kitservices.dev';
let apiOverride: string|null = null;
let session: Promise<any>;

export function init(api: string): void {
	if(!browser) return;
	defaultApi = api;

	session = fetch(`${getApi()}/session`, {
		headers: getHeaders(),
		mode: 'cors',
		credentials: 'include',
		cache: 'no-store',
		redirect: 'error',
	});
}

export function get(endpoint: string, params: { [key: string]: string }): Promise<any> {
	return doRequest('GET', addParamsTo(endpoint, params), null);
}

export function post(endpoint: string, body: object): Promise<any> {
	return doRequest('POST', endpoint, body);
}

export function patch(endpoint: string, body: object): Promise<any> {
	return doRequest('PATCH', endpoint, body);
}

export function put(endpoint: string, body: object): Promise<any> {
	return doRequest('PUT', endpoint, body);
}

export function del(endpoint: string, params: { [key: string]: string }): Promise<any> {
	return doRequest('DELETE', addParamsTo(endpoint, params), null);
}

export async function upload(endpoint: string, file: File): Promise<any> {
	if(!browser) return null;

	const headers = getHeaders();
	const url = `${getApi()}${endpoint}`;
	const req = await fetch(url, {
		headers,
		method: 'POST',
		body: file,
		mode: 'cors',
		credentials: 'include',
		cache: 'no-store',
		redirect: 'error',
	});

	let res: any;
	try {
		res = await req.json();
	} catch(e) {
		res = null;
	}

	if(req.status != 200) {
		let message = `${req.statusText} (${req.status})`;
		if(res.error) message = res.error;
		throw new Error(message);
	}

	return res;
}

async function doRequest(method: string, endpoint: string, body: object|null): Promise<any> {
	if(!browser) return null;
	await session;

	const headers = getHeaders();
	const url = `${getApi()}${endpoint}`;
	const req = await fetch(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		mode: 'cors',
		credentials: 'include',
		cache: 'no-store',
		redirect: 'error',
	});

	let res: any;
	try {
		res = await req.json();
	} catch(e) {
		res = null;
	}

	if(req.status != 200) {
		let message = `${req.statusText} (${req.status})`;
		if(res.error) message = res.error;
		throw new Error(message);
	}

	return res;
}

function getHeaders(): { [key: string]: string } {
	const headers: { [key: string]: string } = {};
	const adminSessionId = localStorage.getItem('admin-session-id');
	if(adminSessionId) {
		headers['Authorization'] = `Bearer ${adminSessionId}`;
	}

	return headers;
}

function addParamsTo(endpoint: string, params: { [key: string]: string }): string {
	const urlParams = new URLSearchParams();
	for(const k in params) urlParams.set(k, params[k]);
	return `${endpoint}?${urlParams}`;
}

export function getApi(): string {
	if(browser && !apiOverride) {
		const cookies = document.cookie.split(';');
		for(const cookie of cookies) {
			const [key, value] = cookie.split('=');
			if(key == 'api') {
				apiOverride = decodeURIComponent(value);
				return apiOverride;
			}
		}
	}

	if(apiOverride) return apiOverride;
	else return defaultApi;
}
