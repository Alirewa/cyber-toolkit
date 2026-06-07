import { IsEnum, IsString } from "class-validator";
import { Role } from "@cyberlab/types";

export class AssignRoleDto {
  @IsEnum(Role)
  role!: Role;

  @IsString()
  userId!: string;
}
