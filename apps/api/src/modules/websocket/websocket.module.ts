import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { WebsocketGateway } from "./websocket.gateway";
import { WebsocketService } from "./websocket.service";

@Module({
  imports: [JwtModule.register({})],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}
