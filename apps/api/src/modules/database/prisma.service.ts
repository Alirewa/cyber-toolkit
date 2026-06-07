import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import type { INestApplication } from "@nestjs/common";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ],
    });

    // Soft-delete middleware: automatically filter out deleted users
    this.$use(async (params, next) => {
      if (params.model === "User") {
        if (
          params.action === "findUnique" ||
          params.action === "findFirst" ||
          params.action === "findMany"
        ) {
          params.args.where = {
            ...((params.args.where as Record<string, unknown>) ?? {}),
            deletedAt: null,
          };
        }
        if (params.action === "count") {
          params.args.where = {
            ...((params.args.where as Record<string, unknown>) ?? {}),
            deletedAt: null,
          };
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connected");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", () => {
      void app.close();
    });
  }
}
