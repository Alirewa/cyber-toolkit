import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { BackupService } from "./backup.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@cyberlab/types";
import { Role } from "@cyberlab/types";
import { IsEnum, IsOptional, IsString } from "class-validator";

class TriggerBackupDto {
  @IsEnum(["database", "config", "full"])
  type!: "database" | "config" | "full";

  @IsOptional()
  @IsString()
  organizationId?: string;
}

@Controller("backup")
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post("trigger")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async trigger(@Body() dto: TriggerBackupDto, @CurrentUser() _user: JwtPayload) {
    return this.backupService.triggerBackup(dto.type, dto.organizationId);
  }

  @Get("records")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async listRecords(
    @Query("orgId") orgId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.backupService.listBackups({
      organizationId: orgId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
