import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@cyberlab/types";
import type { JwtPayload, PaginationQuery } from "@cyberlab/types";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser() user: JwtPayload) {
    const u = await this.usersService.getUserWithRoles(user.sub);
    return { data: u, message: "Profile retrieved" };
  }

  @Patch("me")
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.sub, dto);
    return { data: updated, message: "Profile updated" };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: PaginationQuery) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.getUserWithRoles(id);
    return { data: user, message: "User retrieved" };
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return { data: user, message: "User updated" };
  }

  @Patch(":id/ban")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async ban(
    @Param("id") id: string,
    @Body() body: { isBanned: boolean; banReason?: string }
  ) {
    const user = await this.usersService.ban(id, body.isBanned, body.banReason);
    return { data: user, message: body.isBanned ? "User banned" : "User unbanned" };
  }

  @Delete(":id")
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param("id") id: string) {
    await this.usersService.softDelete(id);
    return { data: null, message: "User deleted" };
  }
}
