import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpdateProfileExtDto {
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) interests?: string[];
  @IsOptional() @IsUrl() @MaxLength(200) githubUrl?: string;
  @IsOptional() @IsUrl() @MaxLength(200) twitterUrl?: string;
  @IsOptional() @IsUrl() @MaxLength(200) linkedinUrl?: string;
  @IsOptional() @IsUrl() @MaxLength(200) websiteUrl?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsBoolean() showActivity?: boolean;
  @IsOptional() @IsBoolean() showAchievements?: boolean;
}
