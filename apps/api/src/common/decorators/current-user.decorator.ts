import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@cyberlab/types";
import type { Request } from "express";

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    if (!data) return request.user;
    return request.user?.[data];
  }
);
