import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { parseIdempotencyKey } from "../common/idempotency";
import { Role } from "../generated/prisma/enums";
import { CardsService } from "./cards.service";
import { CardPaymentDto, IssueCardDto, UpdateCardDto } from "./dto/card.dto";

@ApiTags("cards")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("cards")
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.cards.list(user.id);
  }

  @Post()
  issue(@CurrentUser() user: AuthUser, @Body() dto: IssueCardDto, @Req() req: Request) {
    return this.cards.issue(user.id, dto, req.ip);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
    @Req() req: Request,
  ) {
    return this.cards.update(user.id, id, dto, req.ip);
  }

  @Post(":id/pay")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiHeader({ name: "Idempotency-Key", required: false })
  pay(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CardPaymentDto,
    @Headers("idempotency-key") key: string | undefined,
    @Req() req: Request,
  ) {
    return this.cards.pay(user.id, id, dto, parseIdempotencyKey(key, false), req.ip);
  }
}