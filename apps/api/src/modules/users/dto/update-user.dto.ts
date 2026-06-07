import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  banReason?: string;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
