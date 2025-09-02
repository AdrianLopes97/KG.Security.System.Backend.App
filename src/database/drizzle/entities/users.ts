import { relations } from "drizzle-orm";
import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";

export const usersTable = pgTable(
  "users",
  {
    ...commonFields(),
    phoneNumber: varchar("phone_number").unique().notNull(),
    email: varchar("email").unique().notNull(),
    firstName: varchar("first_name").notNull(),
    lastName: varchar("last_name").notNull(),
    password: varchar("password").notNull(),
  },
  table => ({
    emailIndex: index().on(table.email),
    phoneNumberIndex: index().on(table.phoneNumber),
  }),
);

export const usersTableRelations = relations(usersTable, () => ({}));

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
