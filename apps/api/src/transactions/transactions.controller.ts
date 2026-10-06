import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { parseIdempotencyKey } from "../common/idempotency";
import { Role } from "../generated/prisma/enums";
import { CashDto } from "./dto/cash.dto";
import { HistoryQueryDto } from "./dto/history-query.dto";
import { TransferDto } from "./dto/transfer.dto";
import { TransactionsService } from "./transactions.service";

const KEY_HEADER = { name: "Idempotency-Key", required: false, description: "Same key twice = one operation" };

@ApiTags("transactions")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post("deposit")
  @ApiHeader(KEY_HEADER)
  deposit(
    @CurrentUser() user: AuthUser,
    @Body() dto: CashDto,
    @Headers("idempotency-key") key: string | undefined,
    @Req() req: Request,
  ) {
    return this.transactions.deposit(user.id, dto, {
      idempotencyKey: parseIdempotencyKey(key, false),
      ip: req.ip,
    });
  }

  @Post("withdraw")
  @ApiHeader(KEY_HEADER)
  withdraw(
    @CurrentUser() user: AuthUser,
    @Body() dto: CashDto,
    @Headers("idempotency-key") key: string | undefined,
    @Req() req: Request,
  ) {
    return this.transactions.withdraw(user.id, dto, {
      idempotencyKey: parseIdempotencyKey(key, false),
      ip: req.ip,
    });
  }

  @Get("recent")
  recent(@CurrentUser() user: AuthUser, @Query("limit", new ParseIntPipe({ optional: true })) limit = 8) {
    return this.transactions.recent(user.id, Math.min(Math.max(limit, 1), 30));
  }
}

@ApiTags("transfers")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("transfers")
export class TransfersController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiHeader({ ...KEY_HEADER, required: true })
  transfer(
    @CurrentUser() user: AuthUser,
    @Body() dto: TransferDto,
    @Headers("idempotency-key") key: string | undefined,
    @Req() req: Request,
  ) {
    return this.transactions.transfer(user.id, dto, {
      idempotencyKey: parseIdempotencyKey(key, true),
      ip: req.ip,
    });
  }
}

@ApiTags("accounts")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("accounts/:accountId/transactions")
export class AccountTransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  history(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseUUIDPipe) accountId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.transactions.history(user.id, accountId, query);
  }
}