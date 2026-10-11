import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { LedgerService } from "./ledger.service";
import { StatementController } from "./statement.controller";
import { StatementService } from "./statement.service";
import {
  AccountTransactionsController,
  TransactionsController,
  TransfersController,
} from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

@Module({
  imports: [AccountsModule],
  controllers: [TransactionsController, TransfersController, AccountTransactionsController, StatementController],
  providers: [TransactionsService, LedgerService, StatementService],
  exports: [LedgerService, TransactionsService],
})
export class TransactionsModule {}