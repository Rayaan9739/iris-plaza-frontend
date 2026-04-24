import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { json } from "express";
import * as express from "express";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Response } from "express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS configuration for production deployment
  // Allow specific origins (not wildcard '*' when credentials are enabled)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5001",
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  
  // Increase request size limits for file uploads (100MB)
  app.use(json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  
  app.setGlobalPrefix("api");

  /**
   * Validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  /**
   * Swagger API docs
   */
  const config = new DocumentBuilder()
    .setTitle("Iris Plaza API")
    .setDescription("Rental Property Management Platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  /**
   * Health check endpoints for hosting platforms
   * These routes are NOT under the /api prefix
   */
  const adapter = app.getHttpAdapter();
  adapter.get('/', (req, res: Response) => {
    res.json({ 
      status: "API running", 
      service: "Iris Plaza Backend",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString()
    });
  });
  adapter.get('/health', (req, res: Response) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Start server
   * Render automatically provides PORT
   */
  const port = process.env.PORT || 5001;
  await app.listen(port);

  console.log(`Server running on port ${port}`);
  console.log(`Application running at: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error("Fatal error during application bootstrap:", err);
  // Don't exit - let the process stay alive for health checks
});
