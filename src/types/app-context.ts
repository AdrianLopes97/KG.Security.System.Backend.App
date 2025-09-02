import type { Request, Response } from "express";
import type { User } from "~/database/drizzle/entities/users";

export type ContextUser = Omit<User, "password">;

export interface AppContext {
  request: Request;
  response: Response;
  user?: ContextUser | null;
}

export interface AppContextWithUser extends Omit<AppContext, "user"> {
  user: ContextUser;
}

export interface RequestWithUser extends Request {
  user: ContextUser;
}
