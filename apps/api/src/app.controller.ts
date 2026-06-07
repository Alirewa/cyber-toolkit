import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";

@Controller()
export class AppController {
  @Get()
  @Public()
  root() {
    return { name: "CyberLab API", version: "1.0.0", status: "running" };
  }
}
