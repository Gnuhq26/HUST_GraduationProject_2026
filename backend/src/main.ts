import 'dotenv/config'; // Load environment variables FIRST
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-ID', 'X-Subdomain'],
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ properties không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có property thừa
      transform: true, // Tự động transform plain object thành DTO class
    }),
  );

  // Global exception filter & logging
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant API')
    .setDescription('Multi-tenant store management system with RBAC')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching with @ApiBearerAuth() in controllers
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-store-id',
        in: 'header',
        description: 'Store ID for multi-tenant context',
      },
      'store-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-subdomain',
        in: 'header',
        description: 'Store subdomain for multi-tenant context',
      },
      'subdomain',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
