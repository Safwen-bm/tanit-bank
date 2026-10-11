import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { CardsController } from "./cards.controller";
import { CardsService } from "./cards.service";

@Module({
  imports: [AccountsModule, TransactionsModule],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}