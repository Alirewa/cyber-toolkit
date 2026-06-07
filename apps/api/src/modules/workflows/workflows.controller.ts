import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";
import { WorkflowExecutionService } from "./workflow-execution.service";
import { IsOptional, IsString } from "class-validator";

class CreateWorkflowDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() triggerType?: string;
  @IsOptional() triggerConfig?: Record<string, unknown>;
  @IsOptional() nodes?: unknown[];
  @IsOptional() edges?: unknown[];
  @IsOptional() @IsString() teamId?: string;
}

class ExecuteWorkflowDto {
  @IsOptional() input?: Record<string, unknown>;
}

@Controller("workflows")
export class WorkflowsController {
  constructor(
    private readonly workflows: WorkflowsService,
    private readonly executions: WorkflowExecutionService,
  ) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateWorkflowDto) {
    return this.workflows.create(req.user.id, dto as never);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.workflows.findAll(req.user.id, page, limit);
  }

  @Get("executions/:execId")
  getExecution(@Request() req: { user: { id: string } }, @Param("execId") execId: string) {
    return this.executions.getExecution(execId, req.user.id);
  }

  @Get(":id")
  findById(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.workflows.findById(id, req.user.id);
  }

  @Patch(":id")
  update(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: Partial<CreateWorkflowDto> & { isEnabled?: boolean }) {
    return this.workflows.update(id, req.user.id, dto as never);
  }

  @Delete(":id")
  archive(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.workflows.archive(id, req.user.id);
  }

  @Post(":id/execute")
  execute(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: ExecuteWorkflowDto) {
    return this.executions.run(id, req.user.id, dto.input);
  }

  @Post(":id/clone")
  clone(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.workflows.clone(id, req.user.id);
  }

  @Get(":id/executions")
  getExecutions(
    @Request() req: { user: { id: string } },
    @Param("id") id: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.executions.getExecutions(id, req.user.id, page, limit);
  }

  @Delete(":id/executions/:execId")
  cancelExecution(
    @Request() req: { user: { id: string } },
    @Param("execId") execId: string,
  ) {
    return this.executions.cancel(execId, req.user.id);
  }
}
