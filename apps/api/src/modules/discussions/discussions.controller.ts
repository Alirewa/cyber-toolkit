import {
  Controller, Get, Post, Delete, Patch, Param, Query, Body,
  Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { DiscussionsService } from "./discussions.service";
import { CreateDiscussionDto, CreateReplyDto } from "./dto/create-discussion.dto";
import { IsIn, IsNumber } from "class-validator";

class VoteDto { @IsNumber() @IsIn([-1, 1]) value!: 1 | -1; }

@Controller("discussions")
export class DiscussionsController {
  constructor(private readonly service: DiscussionsService) {}

  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("category") category?: string,
    @Query("labId") labId?: string,
    @Query("sort") sort?: "hot" | "new" | "top",
    @Query("search") search?: string,
  ) {
    return this.service.findAll(page, Math.min(limit, 50), { category, labId, sort, search });
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateDiscussionDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get(":id")
  findById(@Param("id") id: string, @Request() req: { user?: { id: string } }) {
    return this.service.findById(id, req.user?.id);
  }

  @Delete(":id")
  delete(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.delete(id, req.user.id);
  }

  @Post(":id/replies")
  createReply(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: CreateReplyDto) {
    return this.service.createReply(id, req.user.id, dto);
  }

  @Delete("replies/:replyId")
  deleteReply(@Request() req: { user: { id: string } }, @Param("replyId") replyId: string) {
    return this.service.deleteReply(replyId, req.user.id);
  }

  @Patch(":id/replies/:replyId/accept")
  markAccepted(@Request() req: { user: { id: string } }, @Param("id") id: string, @Param("replyId") replyId: string) {
    return this.service.markAccepted(id, replyId, req.user.id);
  }

  @Post(":id/vote")
  voteDiscussion(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: VoteDto) {
    return this.service.vote(req.user.id, id, null, dto.value);
  }

  @Post("replies/:replyId/vote")
  voteReply(@Request() req: { user: { id: string } }, @Param("replyId") replyId: string, @Body() dto: VoteDto) {
    return this.service.vote(req.user.id, null, replyId, dto.value);
  }
}
