import { Module } from "@nestjs/common";
import { EnterpriseRbacService } from "./enterprise-rbac.service";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [EnterpriseRbacService],
  exports: [EnterpriseRbacService],
})
export class EnterpriseRbacModule {}
