import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  Request, ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { WriteupsService } from "./writeups.service";
import { CreateWriteupDto, CreateNoteDto } from "./dto/create-writeup.dto";

@Controller("writeups")
export class WriteupsController {
  constructor(private readonly service: WriteupsService) {}

  // ── Writeups ──────────────────────────────────────────────────
  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("category") category?: string,
    @Query("tag") tag?: string,
    @Query("search") search?: string,
  ) {
    return this.service.findAll(page, Math.min(limit, 50), { category, tag, search });
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateWriteupDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get("me")
  getMyWriteups(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getMyWriteups(req.user.id, page, limit);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string, @Request() req: { user?: { id: string } }) {
    return this.service.findBySlug(slug, req.user?.id);
  }

  @Patch(":id")
  update(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: Partial<CreateWriteupDto>) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(":id")
  delete(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.delete(id, req.user.id);
  }

  // ── Notes ─────────────────────────────────────────────────────
  @Get("notes/me")
  getMyNotes(@Request() req: { user: { id: string } }, @Query("labId") labId?: string) {
    return this.service.getMyNotes(req.user.id, labId);
  }

  @Post("notes")
  createNote(@Request() req: { user: { id: string } }, @Body() dto: CreateNoteDto) {
    return this.service.createNote(req.user.id, dto);
  }

  @Patch("notes/:id")
  updateNote(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: Partial<CreateNoteDto>) {
    return this.service.updateNote(id, req.user.id, dto);
  }

  @Delete("notes/:id")
  deleteNote(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.deleteNote(id, req.user.id);
  }
}
