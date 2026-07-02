import type { ApiRoutes } from '@ts-template/api';
import { hc } from 'hono/client';

const API_BASE = import.meta.env.VITE_API_URL as string;

const customFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> => {
    const headers = new Headers(init?.headers);

    // This is where to implement refresh logic or set custom headers

    return fetch(input, { ...init, headers });
};

export const client = hc<ApiRoutes>(API_BASE, {
    fetch: customFetch,
    init: { credentials: 'include' },
});
