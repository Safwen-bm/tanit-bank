import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "../generated/prisma/enums";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("ledger-check")
  ledgerCheck() {
    return this.admin.ledgerCheck();
  }
}