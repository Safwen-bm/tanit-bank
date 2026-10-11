import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import { AdminAuditService } from "./admin-audit.service";
import { AdminCustomersService } from "./admin-customers.service";
import { AdminStatsService } from "./admin-stats.service";
import { AdminTransactionsService } from "./admin-transactions.service";
import { AdminService } from "./admin.service";
import {
  AdminCustomersQueryDto,
  AdminTransactionsQueryDto,
  AuditQueryDto,
  SetAccountStatusDto,
  SetCustomerActiveDto,
} from "./dto/admin.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly stats: AdminStatsService,
    private readonly customers: AdminCustomersService,
    private readonly transactions: AdminTransactionsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get("ledger-check")
  ledgerCheck() {
    return this.admin.ledgerCheck();
  }

  @Get("stats")
  getStats() {
    return this.stats.stats();
  }

  @Get("customers")
  listCustomers(@Query() query: AdminCustomersQueryDto) {
    return this.customers.list(query);
  }

  @Get("customers/:id")
  getCustomer(@Param("id", ParseUUIDPipe) id: string) {
    return this.customers.get(id);
  }

  @Patch("customers/:id/status")
  setCustomerActive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetCustomerActiveDto,
    @Req() req: Request,
  ) {
    return this.customers.setActive(id, dto.isActive, admin.id, req.ip);
  }

  @Patch("accounts/:id/status")
  setAccountStatus(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetAccountStatusDto,
    @Req() req: Request,
  ) {
    return this.customers.setAccountStatus(id, dto, admin.id, req.ip);
  }

  @Get("transactions")
  listTransactions(@Query() query: AdminTransactionsQueryDto) {
    return this.transactions.list(query);
  }

  @Get("audit-logs")
  listAuditLogs(@Query() query: AuditQueryDto) {
    return this.audit.list(query);
  }
}