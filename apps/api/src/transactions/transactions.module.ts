import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { LedgerService } from "./ledger.service";
import {
  AccountTransactionsController,
  TransactionsController,
  TransfersController,
} from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

@Module({
  imports: [AccountsModule],
  controllers: [TransactionsController, TransfersController, AccountTransactionsController],
  providers: [TransactionsService, LedgerService],
  exports: [LedgerService],
})
export class TransactionsModule {}