import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query
} from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@cyberlab/types";
import { Role } from "@cyberlab/types";
import {
  IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray, IsDateString, IsObject
} from "class-validator";

class CreateFlagDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) rolloutPct?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) environments?: string[];
}

class UpdateFlagDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) rolloutPct?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) environments?: string[];
}

class SetOverrideDto {
  @IsString() flagName!: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsBoolean() isEnabled!: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) rolloutPct?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
}

@Controller("feature-flags")
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async list() {
    return this.service.listFlags();
  }

  @Get("evaluate/:name")
  async evaluate(
    @Param("name") name: string,
    @Query("orgId") organizationId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const enabled = await this.service.isEnabled(name, {
      userId: user?.sub,
      organizationId,
    });
    return { data: { name, enabled }, message: "Flag evaluated" };
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateFlagDto) {
    return this.service.createFlag(dto);
  }

  @Patch(":name")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param("name") name: string, @Body() dto: UpdateFlagDto) {
    return this.service.updateFlag(name, dto);
  }

  @Post(":name/toggle")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggle(@Param("name") name: string) {
    return this.service.toggleFlag(name);
  }

  @Delete(":name")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param("name") name: string) {
    return this.service.deleteFlag(name);
  }

  @Post("overrides")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async setOverride(@Body() dto: SetOverrideDto) {
    return this.service.setOverride({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Delete("overrides/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteOverride(@Param("id") id: string) {
    return this.service.deleteOverride(id);
  }
}
