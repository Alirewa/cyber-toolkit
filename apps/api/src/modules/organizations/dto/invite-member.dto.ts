import { IsString, IsOptional, IsEmail, IsEnum } from "class-validator";
import { OrgRole } from "@cyberlab/types";

export class InviteMemberDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
