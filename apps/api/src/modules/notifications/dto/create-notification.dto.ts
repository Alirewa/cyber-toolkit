import { IsEnum, IsOptional, IsString } from "class-validator";
import type { NotificationType } from "@cyberlab/types";

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
