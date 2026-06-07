import { AlertChannel, AlertSeverity } from "@prisma/client";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateAlertRuleDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(AlertSeverity) severity!: AlertSeverity;
  conditions!: {
    type: "finding_created" | "finding_severity" | "workflow_failed" | "custom";
    value?: string;
  };
  action!: {
    channels: AlertChannel[];
    emailTo?: string;
    webhookUrl?: string;
  };
  @IsOptional() @IsNumber() @Min(5) cooldownMin?: number;
}

export class CreateAlertDto {
  @IsString() userId!: string;
  @IsString() title!: string;
  @IsString() message!: string;
  @IsEnum(AlertSeverity) severity!: AlertSeverity;
  @IsOptional() @IsString() ruleId?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsArray() channels?: AlertChannel[];
  @IsOptional() @IsString() emailTo?: string;
  @IsOptional() @IsString() webhookUrl?: string;
}
