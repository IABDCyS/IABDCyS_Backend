import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  console.log('🚀 Starting application...');
  
  const app = await NestFactory.create(AppModule);
  console.log('✅ App module created successfully');

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      // frontend url
      'https://pfe-v2-xi.vercel.app',
      'https://pfe-v2-three.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  console.log('✅ CORS enabled');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  console.log('✅ Validation pipe configured');

  // Use cookie parser
  app.use(cookieParser());
  console.log('✅ Cookie parser configured');

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['/health'],
  });
  console.log('✅ Global prefix configured');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Student Application Management System API')
    .setDescription('API documentation for the Student Application Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  console.log('✅ Swagger documentation configured');

  // Start the server
  const port = process.env.PORT || 3001;
  console.log(`🌐 Attempting to start server on port ${port}...`);
  
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}`);
  console.log(`✅ Health check available at: http://localhost:${port}/health`);
}

bootstrap();
