export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value?.trim())
        throw new Error(`Missing required environment variable: ${name}`);
    return value.trim();
}

export function requireEnvInt(name: string): number {
    const value = requireEnv(name);
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed))
        throw new Error(`Environment variable ${name} must be an integer`);
    return parsed;
}
