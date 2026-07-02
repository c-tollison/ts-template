import { Stage } from '@ts-template/types';
import type { cors } from 'hono/cors';

type CorsOptions = NonNullable<Parameters<typeof cors>[0]>;

function getOriginsForStage(stage: Stage): string[] {
    switch (stage) {
        case Stage.Local:
            return ['http://localhost:5173'];
        case Stage.Dev:
            return [];
        case Stage.Prod:
            return [];
    }
}

export function getCorsConfig(stage: Stage): CorsOptions {
    return {
        origin: getOriginsForStage(stage),
        allowHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        maxAge: 86400,
        credentials: true,
    };
}
