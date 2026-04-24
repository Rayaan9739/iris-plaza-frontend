"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const express = require("express");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5001",
        process.env.FRONTEND_URL,
    ].filter((origin) => Boolean(origin));
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.use((0, express_1.json)({ limit: "100mb" }));
    app.use(express.urlencoded({ limit: "100mb", extended: true }));
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Iris Plaza API")
        .setDescription("Rental Property Management Platform API")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const adapter = app.getHttpAdapter();
    adapter.get('/', (req, res) => {
        res.json({
            status: "API running",
            service: "Iris Plaza Backend",
            version: process.env.npm_package_version || "1.0.0",
            timestamp: new Date().toISOString()
        });
    });
    adapter.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
    const port = process.env.PORT || 5001;
    await app.listen(port);
    console.log(`Server running on port ${port}`);
    console.log(`Application running at: http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => {
    console.error("Fatal error during application bootstrap:", err);
});
//# sourceMappingURL=main.js.map