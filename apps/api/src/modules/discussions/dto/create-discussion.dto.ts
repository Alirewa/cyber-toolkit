import { IsArray, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateDiscussionDto {
  @IsString() @MinLength(5) @MaxLength(300) title!: string;
  @IsString() @MinLength(10) body!: string;
  @IsOptional() @IsString() labId?: string;
  @IsOptional() @IsString() @MaxLength(30) category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class CreateReplyDto {
  @IsString() @MinLength(5) body!: string;
  @IsOptional() @IsString() parentId?: string;
}
