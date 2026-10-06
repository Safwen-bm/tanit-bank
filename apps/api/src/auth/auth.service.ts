import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHmac, randomBytes } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import { Prisma } from "../generated/prisma/client";
import { Role } from "../generated/prisma/enums";
import { AccountsService } from "../accounts/accounts.service";
import { PrismaService } from "../prisma/prisma.service";
import { REFRESH_TTL_MS } from "./auth.cookies";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

// A rotated refresh token reused within this window is treated as a race between
// two tabs, not as theft.
const REUSE_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly accounts: AccountsService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: dto.fullName.trim(),
          profile: { create: { monthlyIncome: dto.monthlyIncome, phone: dto.phone } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An account with this email already exists");
      }
      throw error;
    }

    await this.audit.log({ userId: user.id, action: "AUTH_REGISTER", ip: meta.ip });

    // Every new customer starts with a current account. If this fails the user can open one later.
    await this.accounts.openDefault(user.id, meta.ip).catch((error) => {
      this.logger.error("Could not open the default account", error as Error);
    });
    return this.startSession(user, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always run one argon2 verification so response time does not reveal unknown emails.
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, dto.password).catch(() => false);

    if (!user || !valid || !user.isActive) {
      await this.audit.log({
        userId: user?.id,
        action: "AUTH_LOGIN_FAILED",
        metadata: { email },
        ip: meta.ip,
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.audit.log({ userId: user.id, action: "AUTH_LOGIN", ip: meta.ip });
    return this.startSession(user, meta);
  }

  async refresh(token: string | undefined, meta: RequestMeta): Promise<AuthResult> {
    if (!token) throw new UnauthorizedException("No session");

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException("Invalid session");

    if (session.revokedAt) {
      const age = Date.now() - session.revokedAt.getTime();
      if (age > REUSE_GRACE_MS) {
        // An old, already-rotated token came back: assume theft and kill every session.
        await this.prisma.refreshSession.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await this.audit.log({
          userId: session.userId,
          action: "AUTH_TOKEN_REUSE_DETECTED",
          ip: meta.ip,
        });
      }
      throw new UnauthorizedException("Session expired");
    }

    if (session.expiresAt.getTime() < Date.now() || !session.user.isActive) {
      throw new UnauthorizedException("Session expired");
    }

    // Rotation: the old token dies, a new one is issued. The conditional update makes
    // sure only one of two parallel refresh calls can win.
    const rotated = await this.prisma.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (rotated.count !== 1) throw new UnauthorizedException("Session expired");

    return this.startSession(session.user, meta);
  }

  async logout(token: string | undefined, meta: RequestMeta): Promise<void> {
    if (!token) return;
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!session) return;

    if (!session.revokedAt) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.log({ userId: session.userId, action: "AUTH_LOGOUT", ip: meta.ip });
  }

  private async startSession(
    user: { id: string; email: string; fullName: string; role: Role },
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  /** Only a keyed hash of the refresh token is stored, never the token itself. */
  private hashToken(token: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("JWT_REFRESH_SECRET"))
      .update(token)
      .digest("hex");
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash(randomBytes(16).toString("hex"), { type: argon2.argon2id });
    return this.dummyHash;
  }
}