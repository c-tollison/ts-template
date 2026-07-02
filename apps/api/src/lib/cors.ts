import type { cors } from 'hono/cors';

import type { Config } from './config';

type CorsOptions = NonNullable<Parameters<typeof cors>[0]>;

export function getCorsConfig(config: Config): CorsOptions {
    return {
        origin: config.corsOrigins,
        allowHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        maxAge: 86400,
        credentials: true,
    };
}
