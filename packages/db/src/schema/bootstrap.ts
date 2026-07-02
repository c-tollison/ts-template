import { uuid } from 'drizzle-orm/pg-core';

/** UUID as primary key for records */
export const id = uuid('id').primaryKey().defaultRandom();
