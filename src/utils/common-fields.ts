import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

export const commonFields = () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at")
    .default(sql`(now() at time zone 'utc')`)
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`(now() at time zone 'utc')`)
    .$defaultFn(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
