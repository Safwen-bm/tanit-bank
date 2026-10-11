import { Module } from "@nestjs/common";
import { TransactionsModule } from "../transactions/transactions.module";
import { AdminAuditService } from "./admin-audit.service";
import { AdminCustomersService } from "./admin-customers.service";
import { AdminStatsService } from "./admin-stats.service";
import { AdminTransactionsService } from "./admin-transactions.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TransactionsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminStatsService, AdminCustomersService, AdminTransactionsService, AdminAuditService],
})
export class AdminModule {}