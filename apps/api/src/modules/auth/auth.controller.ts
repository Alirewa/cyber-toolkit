import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@cyberlab/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip);
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, req.ip ?? "", req.headers["user-agent"] ?? "");

    // Set refresh token as httpOnly cookie
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SEVEN_DAYS_MS,
      path: "/api/auth",
    });

    return {
      data: { accessToken: result.accessToken, user: result.user },
      message: "Login successful",
    };
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.["refresh_token"] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const result = await this.authService.refresh(refreshToken, req.ip ?? "");

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SEVEN_DAYS_MS,
      path: "/api/auth",
    });

    return { data: { accessToken: result.accessToken }, message: "Token refreshed" };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.["refresh_token"] as string | undefined;
    if (refreshToken) {
      await this.authService.logout(user.sub, user.sessionId, refreshToken);
    }

    res.clearCookie("refresh_token", { path: "/api/auth" });
    return { data: null, message: "Logged out successfully" };
  }

  @Post("forgot-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { data: null, message: "If that email is registered, a reset link has been sent." };
  }

  @Post("reset-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { data: null, message: "Password reset successfully" };
  }

  @Get("verify-email")
  @Public()
  async verifyEmail(@Query("token") token: string) {
    await this.authService.verifyEmail(token);
    return { data: null, message: "Email verified successfully" };
  }

  @Get("me")
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Get("sessions")
  async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getSessions(user.sub);
  }

  @Delete("sessions/:id")
  async revokeSession(@CurrentUser() user: JwtPayload, @Param("id") sessionId: string) {
    await this.authService.revokeSession(user.sub, sessionId);
    return { data: null, message: "Session revoked" };
  }

  @Delete("sessions")
  async revokeAllOtherSessions(@CurrentUser() user: JwtPayload) {
    await this.authService.revokeAllOtherSessions(user.sub, user.sessionId);
    return { data: null, message: "All other sessions revoked" };
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    return { data: null, message: "Password changed successfully" };
  }
}
