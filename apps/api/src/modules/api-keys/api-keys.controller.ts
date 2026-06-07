import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@cyberlab/types";

@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.sub, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.apiKeysService.findAll(user.sub);
  }

  @Delete(":id")
  async revoke(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    await this.apiKeysService.revoke(user.sub, id);
    return { data: null, message: "API key revoked" };
  }
}
