import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { eq } from "drizzle-orm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { drizzle } from "~/database/drizzle";
import { usersTable } from "~/database/drizzle/entities/users";
import { env } from "~/env";
import { ContextUser } from "~/types/app-context";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: any): Promise<ContextUser> {
    const user = await drizzle.query.usersTable.findFirst({
      where: eq(usersTable.id, payload.sub),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
