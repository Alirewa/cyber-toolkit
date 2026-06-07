import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "@cyberlab/types";
import type { JwtPayload, PaginationQuery } from "@cyberlab/types";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(
    @Query() query: PaginationQuery & { userId?: string; action?: string; resource?: string; from?: string; to?: string }
  ) {
    return this.auditLogsService.findAll(query);
  }

  @Get("me")
  async findMine(@CurrentUser() user: JwtPayload, @Query() query: PaginationQuery) {
    return this.auditLogsService.findForUser(user.sub, query);
  }
}
