import { Controller, Get, Post, Patch, Delete, Param, Body, Request } from "@nestjs/common";
import { ScheduledJobType } from "@prisma/client";
import { SchedulerService } from "./scheduler.service";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

class CreateJobDto {
  @IsString() name!: string;
  @IsEnum(ScheduledJobType) type!: ScheduledJobType;
  @IsString() cronExpression!: string;
  @IsOptional() @IsString() timezone?: string;
  @IsObject() config!: Record<string, unknown>;
  @IsOptional() @IsString() workflowId?: string;
}

class UpdateJobDto {
  @IsOptional() isEnabled?: boolean;
  @IsOptional() @IsString() cronExpression?: string;
}

@Controller("scheduled-jobs")
export class SchedulerController {
  constructor(private readonly service: SchedulerService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateJobDto) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(":id")
  update(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: UpdateJobDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  delete(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.delete(id, req.user.id);
  }
}
