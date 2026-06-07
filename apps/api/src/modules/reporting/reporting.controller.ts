import {
  Controller, Get, Post, Param, Query, Body,
  Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { ReportType } from "@prisma/client";
import { ReportingService } from "./reporting.service";
import { GenerateReportDto } from "./dto/generate-report.dto";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

class CreateTemplateDto {
  @IsString() name!: string;
  @IsEnum(ReportType) type!: ReportType;
  @IsOptional() @IsString() description?: string;
  @IsObject() config!: Record<string, unknown>;
}

@Controller("reports")
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Post("generate")
  generate(@Request() req: { user: { id: string } }, @Body() dto: GenerateReportDto) {
    return this.service.generate(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findAll(req.user.id, page, limit);
  }

  @Get("templates")
  getTemplates(@Request() req: { user: { id: string } }) {
    return this.service.getTemplates(req.user.id);
  }

  @Post("templates")
  createTemplate(@Request() req: { user: { id: string } }, @Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(req.user.id, dto);
  }

  @Get(":id")
  findById(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.findById(id, req.user.id);
  }
}
