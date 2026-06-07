import { IsOptional, IsString, IsIn } from "class-validator";
import type { PaginationQuery } from "@cyberlab/types";

export class QueryRunsDto implements PaginationQuery {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  toolSlug?: string;

  @IsOptional()
  @IsIn(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "TIMEOUT"])
  status?: string;
}
