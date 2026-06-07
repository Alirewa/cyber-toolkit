import { Module } from "@nestjs/common";
import { ApiManagementController } from "./api-management.controller";
import { ApiManagementService } from "./api-management.service";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [ApiManagementController],
  providers: [ApiManagementService],
  exports: [ApiManagementService],
})
export class ApiManagementModule {}
