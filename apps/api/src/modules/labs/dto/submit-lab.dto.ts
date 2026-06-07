import { IsObject, IsOptional, IsString } from "class-validator";

export class SubmitLabDto {
  @IsObject()
  answers!: Record<string, string>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
