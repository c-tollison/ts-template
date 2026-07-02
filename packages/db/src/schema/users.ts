import { text } from 'drizzle-orm/pg-core';

import { appSchema, createdAt, id } from './primitives';

export const users = appSchema.table('users', {
    id: id(),
    name: text('name').notNull(),
    createdAt: createdAt(),
});
