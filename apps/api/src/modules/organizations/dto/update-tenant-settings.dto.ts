import { IsOptional, IsBoolean, IsString, IsInt, IsArray, Min, Max } from "class-validator";

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsBoolean()
  ssoEnabled?: boolean;

  @IsOptional()
  @IsString()
  ssoProvider?: string;

  @IsOptional()
  @IsBoolean()
  mfaRequired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  sessionTtlHours?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipAllowlist?: string[];

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(3650)
  dataRetentionDays?: number;
}
