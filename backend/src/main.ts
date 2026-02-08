import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GraphqlHttpExceptionFilter } from './common/filters/graphql-exception.filter';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());
  
  // Configure CORS properly for credentials
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  
  if (!corsOrigin) {
    throw new Error('CORS_ORIGIN environment variable is required');
  }
  
  app.enableCors({
    origin: corsOrigin,
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  console.log(`🌐 CORS configured for origin: ${corsOrigin}`);

  //const envSnapshot = Object.keys(process.env)
  //  .sort()
  //  .map((key) => {
  //    const value = process.env[key];
  //    if (!value) {
  //      return `${key}=`;
  //    }
  //    if (key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD')) {
  //      return `${key}=***`;
  //    }
  //    return `${key}=${value}`;
  //  })
  //  .join('\n');
  //console.log(`Loaded environment variables:\n${envSnapshot}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new GraphqlHttpExceptionFilter());
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  if (nodeEnv !== 'production') {
    app.useLogger(['error']);
    const httpLogger = new Logger('HTTP');
    app.use((req: any, res: any, next: () => void) => {
      const start = Date.now();
      res.on('finish', () => {
        const durationMs = Date.now() - start;
        if (res.statusCode >= 400) {
          httpLogger.error(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
        }
      });
      next();
    });
  }
  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  console.log(`🚀 GraphQL ready at http://localhost:${port}/graphql`);
};

bootstrap();
