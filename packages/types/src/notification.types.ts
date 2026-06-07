export type NotificationType = "SECURITY_ALERT" | "SYSTEM" | "INFO" | "SUCCESS" | "WARNING";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
