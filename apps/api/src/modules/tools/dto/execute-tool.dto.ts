import { IsObject, IsString } from "class-validator";

export class ExecuteToolDto {
  @IsObject()
  input!: Record<string, string>;
}
