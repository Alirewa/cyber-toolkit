import { FindingSeverity, FindingStatus } from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFindingDto {
  @IsString() @MinLength(3) @MaxLength(300) title!: string;
  @IsString() @MinLength(5) description!: string;
  @IsEnum(FindingSeverity) severity!: FindingSeverity;
  @IsOptional() @IsEnum(FindingStatus) status?: FindingStatus;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(300) target?: string;
  @IsOptional() evidence?: Record<string, unknown>;
  @IsOptional() @IsString() toolRunId?: string;
  @IsOptional() @IsString() teamId?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

export class UpdateFindingDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(FindingSeverity) severity?: FindingSeverity;
  @IsOptional() @IsEnum(FindingStatus) status?: FindingStatus;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(300) target?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

export class AddFindingCommentDto {
  @IsString() @MinLength(1) body!: string;
}
