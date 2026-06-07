import { ReportType } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class GenerateReportDto {
  @IsString() title!: string;
  @IsEnum(ReportType) type!: ReportType;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsString() teamId?: string;
  @IsOptional() config?: {
    dateFrom?: string;
    dateTo?: string;
    severity?: string;
    status?: string;
    labId?: string;
  };
}
