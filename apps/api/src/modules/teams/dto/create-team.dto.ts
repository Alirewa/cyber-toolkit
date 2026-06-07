import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateTeamDto {
  @IsString() @MinLength(2) @MaxLength(50) name!: string;

  @IsString() @MinLength(2) @MaxLength(30)
  @Matches(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, hyphens" })
  slug!: string;

  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}
