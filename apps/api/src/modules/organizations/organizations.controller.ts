import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { UpdateTenantSettingsDto } from "./dto/update-tenant-settings.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@cyberlab/types";
import { Role, OrgRole } from "@cyberlab/types";
import { IsEnum } from "class-validator";
import { IsString } from "class-validator";

class UpdateMemberRoleDto {
  @IsEnum(OrgRole)
  role!: OrgRole;
}

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: JwtPayload) {
    return this.orgsService.create(dto, user.sub);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.orgsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get("me")
  async getMyOrgs(@CurrentUser() user: JwtPayload) {
    return this.orgsService.getUserOrganizations(user.sub);
  }

  @Get(":slug")
  async findOne(@Param("slug") slug: string) {
    return this.orgsService.findBySlug(slug);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orgsService.update(id, dto, user.sub);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.orgsService.softDelete(id, user.sub);
  }

  // ── Members ───────────────────────────────────────────────────

  @Get(":id/members")
  async listMembers(@Param("id") id: string) {
    return this.orgsService.listMembers(id);
  }

  @Post(":id/members")
  @HttpCode(HttpStatus.OK)
  async inviteMember(
    @Param("id") id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orgsService.inviteMember(id, dto, user.sub);
  }

  @Patch(":id/members/:userId/role")
  async updateMemberRole(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.orgsService.updateMemberRole(id, userId, dto.role, actor.sub);
  }

  @Delete(":id/members/:userId")
  async removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.orgsService.removeMember(id, userId, actor.sub);
  }

  // ── Tenant Settings ───────────────────────────────────────────

  @Get(":id/settings")
  async getSettings(@Param("id") id: string) {
    return this.orgsService.getTenantSettings(id);
  }

  @Patch(":id/settings")
  async updateSettings(
    @Param("id") id: string,
    @Body() dto: UpdateTenantSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orgsService.updateTenantSettings(id, dto, user.sub);
  }
}
