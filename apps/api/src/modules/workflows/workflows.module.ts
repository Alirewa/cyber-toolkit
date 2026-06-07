import { Module } from "@nestjs/common";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";
import { WorkflowExecutionService } from "./workflow-execution.service";
import { WorkflowEngineService } from "./workflow-engine.service";

// Node handlers
import { TriggerNodeHandler } from "./nodes/trigger.handler";
import { ToolNodeHandler } from "./nodes/tool.handler";
import { FindingNodeHandler } from "./nodes/finding.handler";
import { NotifyNodeHandler } from "./nodes/notify.handler";
import { ConditionNodeHandler } from "./nodes/condition.handler";
import { ReportNodeHandler } from "./nodes/report.handler";
import { DelayNodeHandler } from "./nodes/delay.handler";

// Dependencies from other modules
import { ToolsModule } from "../tools/tools.module";
import { FindingsModule } from "../findings/findings.module";
import { ReportingModule } from "../reporting/reporting.module";
import { AlertsModule } from "../alerts/alerts.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WebsocketModule } from "../websocket/websocket.module";

@Module({
  imports: [
    ToolsModule,
    FindingsModule,
    ReportingModule,
    AlertsModule,
    NotificationsModule,
    WebsocketModule,
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowExecutionService,
    WorkflowEngineService,
    TriggerNodeHandler,
    ToolNodeHandler,
    FindingNodeHandler,
    NotifyNodeHandler,
    ConditionNodeHandler,
    ReportNodeHandler,
    DelayNodeHandler,
  ],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule {}
