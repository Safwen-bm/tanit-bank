import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import { AccountsService } from "./accounts.service";
import { OpenAccountDto } from "./dto/open-account.dto";

@ApiTags("accounts")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.accounts.list(user.id);
  }

  @Post()
  open(@CurrentUser() user: AuthUser, @Body() dto: OpenAccountDto, @Req() req: Request) {
    return this.accounts.open(user.id, dto, req.ip);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.accounts.getView(user.id, id);
  }
}