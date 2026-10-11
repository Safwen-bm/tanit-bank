import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { LoanApplicationsService } from "./loan-applications.service";
import { AdminLoanApplicationsController, CustomerLoansController } from "./loan-applications.controller";
import { LoanProductsService } from "./loan-products.service";
import { LoanReviewService } from "./loan-review.service";
import { AdminLoanProductsController, PublicLoansController } from "./loans.controller";

@Module({
  imports: [AccountsModule, TransactionsModule],
  controllers: [
    PublicLoansController,
    AdminLoanProductsController,
    CustomerLoansController,
    AdminLoanApplicationsController,
  ],
  providers: [LoanProductsService, LoanApplicationsService, LoanReviewService],
  exports: [LoanProductsService],
})
export class LoansModule {}