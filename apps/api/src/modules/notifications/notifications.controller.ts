import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload, PaginationQuery } from "@cyberlab/types";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationQuery) {
    return this.notificationsService.findForUser(user.sub, query);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { data: { count }, message: "Unread count retrieved" };
  }

  @Patch(":id/read")
  async markAsRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    await this.notificationsService.markAsRead(user.sub, id);
    return { data: null, message: "Notification marked as read" };
  }

  @Patch("read-all")
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user.sub);
    return { data: null, message: "All notifications marked as read" };
  }
}
