import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SaveTargetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  target!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
