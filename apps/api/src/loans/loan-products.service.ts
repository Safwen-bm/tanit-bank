import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma, LoanProduct } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { computeLoan, minimumIncome, UnschedulableLoanError } from "./loan-calculator";
import { CreateLoanProductDto, UpdateLoanProductDto } from "./dto/loan-product.dto";
import { SimulationDto } from "./dto/simulation.dto";
import { assertWithinProduct } from "./loan-rules";

const MAX_RATE = new Prisma.Decimal(40);

export function toProductView(product: LoanProduct) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    annualRate: product.annualRate.toFixed(4),
    minAmount: product.minAmount.toFixed(3),
    maxAmount: product.maxAmount.toFixed(3),
    minMonths: product.minMonths,
    maxMonths: product.maxMonths,
    maxDebtRatio: product.maxDebtRatio.toFixed(4),
    isActive: product.isActive,
  };
}

@Injectable()
export class LoanProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────── Public ─────────────

  async listActive() {
    const products = await this.prisma.loanProduct.findMany({
      where: { isActive: true },
      orderBy: [{ annualRate: "asc" }, { name: "asc" }],
    });
    return products.map(toProductView);
  }

  /** Stateless: nothing is stored. The API is the single source of truth for the maths. */
  async simulate(dto: SimulationDto) {
    const product = await this.prisma.loanProduct.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException("Loan product not available");

    const amount = new Prisma.Decimal(dto.amount);
    assertWithinProduct(product, amount, dto.months);

    try {
      const quote = computeLoan(amount.toFixed(3), product.annualRate.toFixed(4), dto.months);
      return {
        product: { id: product.id, name: product.name, maxDebtRatio: product.maxDebtRatio.toFixed(4) },
        ...quote,
        minimumIncome: minimumIncome(quote.monthlyPayment, product.maxDebtRatio.toFixed(4)),
      };
    } catch (error) {
      if (error instanceof UnschedulableLoanError) throw new UnprocessableEntityException(error.message);
      throw error;
    }
  }

  // ───────────── Admin ─────────────

  async listAll() {
    const products = await this.prisma.loanProduct.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { loans: true } } },
    });
    return products.map((product) => ({ ...toProductView(product), loanCount: product._count.loans }));
  }

  async create(dto: CreateLoanProductDto, adminId: string, ip?: string) {
    this.assertConsistent(dto);
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.loanProduct.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          annualRate: dto.annualRate,
          minAmount: dto.minAmount,
          maxAmount: dto.maxAmount,
          minMonths: dto.minMonths,
          maxMonths: dto.maxMonths,
          maxDebtRatio: dto.maxDebtRatio,
          isActive: dto.isActive ?? true,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "LOAN_PRODUCT_CREATE",
          entity: "LoanProduct",
          entityId: product.id,
          metadata: { name: product.name, annualRate: product.annualRate.toFixed(4) },
          ip,
        },
      });
      return { ...toProductView(product), loanCount: 0 };
    });
  }

  async update(id: string, dto: UpdateLoanProductDto, adminId: string, ip?: string) {
    const current = await this.prisma.loanProduct.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Loan product not found");

    // Cross-field rules are checked on the merged result, not on the partial payload.
    this.assertConsistent({
      annualRate: dto.annualRate ?? current.annualRate.toString(),
      minAmount: dto.minAmount ?? current.minAmount.toString(),
      maxAmount: dto.maxAmount ?? current.maxAmount.toString(),
      minMonths: dto.minMonths ?? current.minMonths,
      maxMonths: dto.maxMonths ?? current.maxMonths,
      maxDebtRatio: dto.maxDebtRatio ?? current.maxDebtRatio.toString(),
    });

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.loanProduct.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description === undefined ? undefined : dto.description.trim() || null,
          annualRate: dto.annualRate,
          minAmount: dto.minAmount,
          maxAmount: dto.maxAmount,
          minMonths: dto.minMonths,
          maxMonths: dto.maxMonths,
          maxDebtRatio: dto.maxDebtRatio,
          isActive: dto.isActive,
        },
        include: { _count: { select: { loans: true } } },
      });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "LOAN_PRODUCT_UPDATE",
          entity: "LoanProduct",
          entityId: id,
          metadata: {
            fields: Object.keys(dto),
            annualRate: { from: current.annualRate.toFixed(4), to: product.annualRate.toFixed(4) },
            isActive: { from: current.isActive, to: product.isActive },
          },
          ip,
        },
      });
      return { ...toProductView(product), loanCount: product._count.loans };
    });
  }

  async remove(id: string, adminId: string, ip?: string) {
    const product = await this.prisma.loanProduct.findUnique({
      where: { id },
      include: { _count: { select: { loans: true } } },
    });
    if (!product) throw new NotFoundException("Loan product not found");
    if (product._count.loans > 0) {
      throw new ConflictException("This product has loans attached. Deactivate it instead of deleting it.");
    }
    await this.prisma.$transaction([
      this.prisma.loanProduct.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: "LOAN_PRODUCT_DELETE",
          entity: "LoanProduct",
          entityId: id,
          metadata: { name: product.name },
          ip,
        },
      }),
    ]);
    return { ok: true };
  }

  private assertConsistent(values: {
    annualRate: string;
    minAmount: string;
    maxAmount: string;
    minMonths: number;
    maxMonths: number;
    maxDebtRatio: string;
  }) {
    const problems: string[] = [];
    if (new Prisma.Decimal(values.annualRate).gt(MAX_RATE)) problems.push("annualRate cannot exceed 40 %");
    if (new Prisma.Decimal(values.minAmount).lte(0)) problems.push("minAmount must be greater than zero");
    if (new Prisma.Decimal(values.maxAmount).lt(values.minAmount)) problems.push("maxAmount must be at least minAmount");
    if (values.maxMonths < values.minMonths) problems.push("maxMonths must be at least minMonths");
    if (new Prisma.Decimal(values.maxDebtRatio).lte(0)) problems.push("maxDebtRatio must be greater than zero");
    if (problems.length > 0) throw new BadRequestException(problems);
  }
}