import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Logger } from '../logger';

export interface ErrorResponse {
    error: string;
}

export function createErrorHandler(logger: Logger): ErrorHandler {
    return (err, c) => {
        const requestId = c.get('requestId');

        if (err instanceof HTTPException) {
            logger.warn(
                { requestId, status: err.status, message: err.message },
                'HTTP error'
            );
            return c.json<ErrorResponse>({ error: err.message }, err.status);
        }

        logger.error(
            { requestId, error: err.message, stack: err.stack },
            'Unhandled error'
        );
        return c.json<ErrorResponse>({ error: 'Internal server error' }, 500);
    };
}
