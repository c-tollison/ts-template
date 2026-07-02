import { Stage } from '@ts-template/types';
import { parse } from 'toml';
import { z } from 'zod';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const StageSchema = z.enum(Stage);

const StageConfigSchema = z.object({
    port: z.number(),
});

const ConfigFileSchema = z.record(z.string(), StageConfigSchema);

export interface DbConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    maxConnections: number;
}

export interface Config {
    stage: Stage;
    port: number;
    db: DbConfig;
}

export { StageSchema };

export function loadConfig(stage: Stage, db: DbConfig): Config {
    const path = resolve(process.cwd(), 'config', 'config.toml');
    const content = readFileSync(path, 'utf-8');
    const configFile = ConfigFileSchema.parse(parse(content));

    const stageConfig = configFile[stage];
    if (!stageConfig) {
        throw new Error(`No config found for stage: ${stage}`);
    }

    return {
        stage,
        port: stageConfig.port,
        db,
    };
}
