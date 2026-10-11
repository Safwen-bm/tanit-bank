import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import {
  AdminApplicationsQueryDto,
  ApplyLoanDto,
  ApproveLoanDto,
  RejectLoanDto,
  RepayDto,
} from "./dto/loan-application.dto";
import { LoanApplicationsService } from "./loan-applications.service";
import { LoanReviewService } from "./loan-review.service";

@ApiTags("loans")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("loans")
export class CustomerLoansController {
  constructor(private readonly loans: LoanApplicationsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyLoanDto, @Req() req: Request) {
    return this.loans.apply(user.id, dto, req.ip);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.loans.list(user.id);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.loans.get(user.id, id);
  }

  @Post(":id/repay")
  repay(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RepayDto,
    @Req() req: Request,
  ) {
    return this.loans.repay(user.id, id, dto, req.ip);
  }
}

@ApiTags("admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/loan-applications")
export class AdminLoanApplicationsController {
  constructor(private readonly review: LoanReviewService) {}

  @Get()
  list(@Query() query: AdminApplicationsQueryDto) {
    return this.review.list(query);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.review.get(id);
  }

  @Post(":id/approve")
  approve(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
    @Req() req: Request,
  ) {
    return this.review.approve(admin.id, id, dto, req.ip);
  }

  @Post(":id/reject")
  reject(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectLoanDto,
    @Req() req: Request,
  ) {
    return this.review.reject(admin.id, id, dto, req.ip);
  }
}