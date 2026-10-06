import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { Role } from "../../generated/prisma/enums";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);