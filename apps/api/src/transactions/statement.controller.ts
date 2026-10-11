import { Controller, Get, Param, ParseUUIDPipe, Query, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiProduces, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { IsDateString, IsOptional } from "class-validator";
import type { Request, Response } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import { StatementService } from "./statement.service";

class StatementQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

@ApiTags("accounts")
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Controller("accounts/:accountId/statement")
export class StatementController {
  constructor(private readonly statements: StatementService) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiProduces("application/pdf")
  async download(
    @CurrentUser() user: AuthUser,
    @Param("accountId", ParseUUIDPipe) accountId: string,
    @Query() query: StatementQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Built fully before anything is sent, so a refusal is still a normal JSON error.
    const { buffer, filename } = await this.statements.pdf(user.id, accountId, query.from, query.to, req.ip);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    });
    res.send(buffer);
  }
}