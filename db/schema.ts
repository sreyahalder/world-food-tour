import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const visits=sqliteTable('visits',{id:text('id').primaryKey(),country:text('country').notNull(),data:text('data').notNull(),createdAt:text('created_at').notNull()});
export const owners=sqliteTable('owners',{id:text('id').primaryKey(),userId:text('user_id').notNull()});
