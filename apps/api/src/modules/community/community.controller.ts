import { Controller, Get, Post, Delete, Patch, Param, Query, Body, Request, ParseIntPipe, DefaultValuePipe } from "@nestjs/common";
import { CommunityService } from "./community.service";
import { ReputationService } from "../reputation/reputation.service";
import { UpdateProfileExtDto } from "./dto/update-profile-ext.dto";

@Controller("community")
export class CommunityController {
  constructor(
    private readonly community: CommunityService,
    private readonly reputation: ReputationService,
  ) {}

  // ── Search ──────────────────────────────────────────────────
  @Get("search")
  search(@Query("q") q: string, @Query("type") type?: "users" | "writeups" | "discussions") {
    return this.community.search(q ?? "", type);
  }

  // ── Feed ────────────────────────────────────────────────────
  @Get("feed")
  getFeed(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.community.getFeed(req.user.id, page, Math.min(limit, 50));
  }

  // ── Leaderboard ─────────────────────────────────────────────
  @Get("leaderboard")
  getLeaderboard(@Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    return this.reputation.getLeaderboard(Math.min(limit, 100));
  }

  // ── Profile ─────────────────────────────────────────────────
  @Get("profile/me")
  getMyProfile(@Request() req: { user: { id: string } }) {
    // Get own profile by userId — look up username first
    return this.community["prisma"].user.findUnique({
      where: { id: req.user.id },
      select: { username: true },
    }).then((u: { username: string } | null) => u ? this.community.getPublicProfile(u.username, req.user.id) : null);
  }

  @Patch("profile/me")
  updateProfile(@Request() req: { user: { id: string } }, @Body() dto: UpdateProfileExtDto) {
    return this.community.updateProfile(req.user.id, dto);
  }

  @Get("profile/:username")
  getProfile(@Param("username") username: string, @Request() req: { user?: { id: string } }) {
    return this.community.getPublicProfile(username, req.user?.id);
  }

  // ── Follows ─────────────────────────────────────────────────
  @Post("follow/:username")
  follow(@Request() req: { user: { id: string } }, @Param("username") username: string) {
    return this.community.follow(req.user.id, username);
  }

  @Delete("follow/:username")
  unfollow(@Request() req: { user: { id: string } }, @Param("username") username: string) {
    return this.community.unfollow(req.user.id, username);
  }

  @Get("profile/:username/followers")
  getFollowers(
    @Param("username") username: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.community.getFollowers(username, page, limit);
  }

  @Get("profile/:username/following")
  getFollowing(
    @Param("username") username: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.community.getFollowing(username, page, limit);
  }

  // ── Bookmarks ────────────────────────────────────────────────
  @Post("bookmarks/:resourceType/:resourceId")
  toggleBookmark(
    @Request() req: { user: { id: string } },
    @Param("resourceType") resourceType: string,
    @Param("resourceId") resourceId: string,
  ) {
    return this.community.toggleBookmark(req.user.id, resourceType, resourceId);
  }

  @Get("bookmarks")
  getBookmarks(
    @Request() req: { user: { id: string } },
    @Query("type") resourceType?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.community.getBookmarks(req.user.id, resourceType, page, limit);
  }
}
