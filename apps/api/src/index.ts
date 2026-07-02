import { serve } from '@hono/node-server';
import {
    createErrorHandler,
    createRequestLoggerMiddleware,
} from '@ts-template/server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { type Config, loadConfig } from './lib/config';
import { init, logger } from './lib/container';
import { getCorsConfig } from './lib/cors';
import helloWorld from './routes/hello-world';

export function createApp(config: Config) {
    const app = new Hono();

    app.use('*', cors(getCorsConfig(config.cors)));
    app.use('*', secureHeaders());
    app.use('*', requestId());
    app.use('*', createRequestLoggerMiddleware(logger()));

    app.notFound(() => {
        throw new HTTPException(404, { message: 'Route not found' });
    });

    app.onError(createErrorHandler(logger()));

    const api = app.basePath('/api');
    api.get('/health', (c) => c.json({ status: 'ok' }));

    // Chain routes here to show types safe routes on frontend client
    return api.route('/test', helloWorld);
}

export type ApiRoutes = ReturnType<typeof createApp>;

function main() {
    const config = loadConfig();

    init(config);

    logger().info({ stage: config.stage }, 'Starting server');

    const app = createApp(config);

    serve(
        {
            fetch: app.fetch,
            port: config.server.port,
        },
        (info) => {
            logger().info({ port: info.port }, 'Server is running');
        }
    );
}

main();
