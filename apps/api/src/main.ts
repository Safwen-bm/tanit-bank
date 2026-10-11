import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind Vercel + Render the real client IP sits in X-Forwarded-For (needed for rate limiting).
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (hops > 0) app.set("trust proxy", hops);

  // The API only returns JSON, so the default CSP is not needed (and breaks Swagger UI).
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? "").split(",").map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle("Tanit Bank API")
    .setDescription(
      [
        "Retail banking REST API: accounts, atomic transfers, loans, cards and an admin back office.",
        "",
        "**Try it:** call `POST /auth/login`, copy the `accessToken` from the response, click **Authorize** and paste it.",
        "",
        "**Money** is always a decimal string with up to 3 decimals (the dinar has millimes), never a JSON number.",
        "",
        "**Idempotency:** transfers require an `Idempotency-Key` header. Sending the same key twice moves the money once.",
        "",
        "Simulated bank for a portfolio project. No real money.",
      ].join("\n"),
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger), {
    customSiteTitle: "Tanit Bank API",
    swaggerOptions: { persistAuthorization: true, tagsSorter: "alpha", operationsSorter: "alpha" },
  });

  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}

bootstrap();