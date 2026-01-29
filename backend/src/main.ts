import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GraphqlHttpExceptionFilter } from './common/filters/graphql-exception.filter';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { cors: true });

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

  const config = app.get(ConfigService);
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
