import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { AssignRoleDto } from "./dto/assign-role.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@cyberlab/types";

@Controller("roles")
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return { data: roles, message: "Roles retrieved" };
  }

  @Post("assign")
  async assign(@Body() dto: AssignRoleDto) {
    await this.rolesService.assignRole(dto.userId, dto.role);
    return { data: null, message: "Role assigned" };
  }

  @Delete(":userId/:role")
  async remove(@Param("userId") userId: string, @Param("role") role: Role) {
    await this.rolesService.removeRole(userId, role);
    return { data: null, message: "Role removed" };
  }
}
