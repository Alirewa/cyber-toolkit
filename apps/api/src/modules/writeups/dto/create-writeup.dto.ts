import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { WriteupCategory, WriteupVisibility } from "@prisma/client";

export class CreateWriteupDto {
  @IsString() @MinLength(3) @MaxLength(300) title!: string;
  @IsString() @MinLength(10) body!: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsEnum(WriteupCategory) category?: WriteupCategory;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsEnum(WriteupVisibility) visibility?: WriteupVisibility;
  @IsOptional() @IsString() labId?: string;
  @IsOptional() @IsBoolean() isDraft?: boolean;
}

export class CreateNoteDto {
  @IsString() @MinLength(1) @MaxLength(300) title!: string;
  @IsString() @MinLength(1) body!: string;
  @IsOptional() @IsString() labId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isPinned?: boolean;
}
