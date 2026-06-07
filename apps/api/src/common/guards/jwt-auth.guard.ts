import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/** Mock user injected in BYPASS_AUTH mode (personal / local use). */
const LOCAL_BYPASS_USER = {
  id: "local-user-001",
  email: "admin@cyberlab.local",
  username: "admin",
  roles: ["ADMIN"],
  sessionId: "local-session-001",
};

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Personal mode — bypass all JWT validation and inject a mock user
    if (process.env["BYPASS_AUTH"] === "true") {
      const req = context.switchToHttp().getRequest<Record<string, unknown>>();
      req["user"] = LOCAL_BYPASS_USER;
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest<T>(err: Error, user: T): T {
    if (err || !user) {
      throw err ?? new UnauthorizedException("Authentication required");
    }
    return user;
  }
}
