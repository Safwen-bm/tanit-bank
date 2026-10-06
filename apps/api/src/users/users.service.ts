import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        profile: {
          select: { monthlyIncome: true, phone: true, address: true },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundException("Profile not found");

    await this.prisma.customerProfile.update({
      where: { userId },
      data: {
        monthlyIncome: dto.monthlyIncome,
        phone: dto.phone,
        address: dto.address,
      },
    });
    await this.audit.log({
      userId,
      action: "PROFILE_UPDATE",
      entity: "CustomerProfile",
      entityId: userId,
      metadata: { fields: Object.keys(dto) },
    });
    return this.me(userId);
  }
}