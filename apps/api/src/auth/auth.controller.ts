import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "./auth.cookies";
import { AuthService, RequestMeta } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

function metaOf(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

@ApiTags("auth")
@Public()
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.auth.register(dto, metaOf(req));
    setAuthCookies(res, refreshToken, result.user.role);
    return result;
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.auth.login(dto, metaOf(req));
    setAuthCookies(res, refreshToken, result.user.role);
    return result;
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { refreshToken, ...result } = await this.auth.refresh(
        req.cookies?.[REFRESH_COOKIE],
        metaOf(req),
      );
      setAuthCookies(res, refreshToken, result.user.role);
      return result;
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE], metaOf(req));
    clearAuthCookies(res);
    return { ok: true };
  }
}