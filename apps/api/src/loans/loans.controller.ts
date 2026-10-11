import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import { CreateLoanProductDto, UpdateLoanProductDto } from "./dto/loan-product.dto";
import { SimulationDto } from "./dto/simulation.dto";
import { LoanProductsService } from "./loan-products.service";

@ApiTags("public")
@Public()
@Controller("public")
export class PublicLoansController {
  constructor(private readonly products: LoanProductsService) {}

  @Get("loan-products")
  list() {
    return this.products.listActive();
  }

  @Post("loan-simulations")
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  simulate(@Body() dto: SimulationDto) {
    return this.products.simulate(dto);
  }
}

@ApiTags("admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/loan-products")
export class AdminLoanProductsController {
  constructor(private readonly products: LoanProductsService) {}

  @Get()
  list() {
    return this.products.listAll();
  }

  @Post()
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateLoanProductDto, @Req() req: Request) {
    return this.products.create(dto, admin.id, req.ip);
  }

  @Patch(":id")
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanProductDto,
    @Req() req: Request,
  ) {
    return this.products.update(id, dto, admin.id, req.ip);
  }

  @Delete(":id")
  remove(@CurrentUser() admin: AuthUser, @Param("id", ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.products.remove(id, admin.id, req.ip);
  }
}