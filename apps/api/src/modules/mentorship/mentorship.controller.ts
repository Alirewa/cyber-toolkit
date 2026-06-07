import {
  Controller, Get, Post, Param, Query, Body, Request,
  ParseIntPipe, DefaultValuePipe,
} from "@nestjs/common";
import { MentorshipService } from "./mentorship.service";
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

class BecomeMentorDto {
  @IsOptional() @IsString() @MaxLength(1000) bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) expertise?: string[];
  @IsOptional() maxStudents?: number;
}

class RequestMentorDto {
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) goals?: string[];
}

class RespondDto { @IsBoolean() accept!: boolean; }

@Controller("mentorship")
export class MentorshipController {
  constructor(private readonly service: MentorshipService) {}

  @Get("mentors")
  listMentors(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.listMentors(page, limit);
  }

  @Get("mentors/:username")
  getMentor(@Param("username") username: string) {
    return this.service.getMentorProfile(username);
  }

  @Post("become-mentor")
  becomeMentor(@Request() req: { user: { id: string } }, @Body() dto: BecomeMentorDto) {
    return this.service.becomeMentor(req.user.id, dto);
  }

  @Post("request/:username")
  request(@Request() req: { user: { id: string } }, @Param("username") username: string, @Body() dto: RequestMentorDto) {
    return this.service.requestMentorship(req.user.id, username, dto);
  }

  @Post("requests/:id/respond")
  respond(@Request() req: { user: { id: string } }, @Param("id") id: string, @Body() dto: RespondDto) {
    return this.service.respondToRequest(id, req.user.id, dto.accept);
  }

  @Get("requests/me")
  getMyRequests(@Request() req: { user: { id: string } }, @Query("role") role: "mentor" | "student" = "student") {
    return this.service.getMyRequests(req.user.id, role);
  }
}
