import {
  Controller, Get, Post, Patch, Delete, Param, Query,
  Body, Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { FindingsService } from "./findings.service";
import { CreateFindingDto, UpdateFindingDto, AddFindingCommentDto } from "./dto/create-finding.dto";

@Controller("findings")
export class FindingsController {
  constructor(private readonly service: FindingsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateFindingDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("severity") severity?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("teamId") teamId?: string,
  ) {
    return this.service.findAll(req.user.id, { severity, status, search, teamId, page, limit });
  }

  @Get("stats")
  getStats(@Request() req: { user: { id: string } }) {
    return this.service.getStats(req.user.id);
  }

  @Get(":id")
  findById(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.findById(id, req.user.id);
  }

  @Patch(":id")
  update(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: UpdateFindingDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  delete(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.delete(id, req.user.id);
  }

  @Post(":id/comments")
  addComment(
    @Request() req: { user: { id: string } },
    @Param("id") id: string,
    @Body() dto: AddFindingCommentDto,
  ) {
    return this.service.addComment(id, req.user.id, dto.body);
  }
}
