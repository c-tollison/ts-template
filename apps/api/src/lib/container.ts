import type { Database } from '@ts-template/db';
import { createLogger, type Logger } from '@ts-template/server';

import type { Config } from './config';
import { createDbClient } from './db';

let _logger: Logger | undefined;
let _config: Config | undefined;
let _db: Database | undefined;

function assertInit<T>(value: T | undefined, name: string): T {
    if (!value)
        throw new Error(
            `Container not initialized: '${name}'. Call init() first.`
        );
    return value;
}

export const logger = (): Logger => assertInit(_logger, 'logger');
export const config = (): Config => assertInit(_config, 'config');
export const db = (): Database => assertInit(_db, 'db');

/** Must be called once at startup before anything else uses this module. */
export function init(cfg: Config): void {
    const log = createLogger(cfg.stage);
    _logger = log;
    _config = cfg;
    _db = createDbClient(cfg, log);
}
