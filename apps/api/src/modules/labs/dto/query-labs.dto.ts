import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import type { LabCategory, LabDifficulty } from "../base/lab-definition.interface";

export class QueryLabsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  difficulty?: LabDifficulty;

  @IsOptional()
  @IsString()
  category?: LabCategory;

  @IsOptional()
  @IsString()
  search?: string;
}
