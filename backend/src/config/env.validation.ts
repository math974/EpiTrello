import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsString()
  CORS_ORIGIN!: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  MINIO_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  MINIO_PORT?: string;

  @IsOptional()
  @IsString()
  MINIO_EXTERNAL_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  MINIO_EXTERNAL_PORT?: string;

  @IsOptional()
  @IsString()
  MINIO_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  MINIO_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  MINIO_BUCKET_NAME?: string;

  @IsOptional()
  @IsString()
  MINIO_USE_SSL?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GITHUB_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  OAUTH_REDIRECT_URI?: string;
}

const normalizeEmptyStrings = (config: Record<string, unknown>) => {
  const normalized = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    ])
  );

  if (normalized.PORT === undefined) {
    normalized.PORT = 4000;
  }

  return normalized;
};

export const validateEnv = (config: Record<string, unknown>) => {
  const normalized = normalizeEmptyStrings(config);
  const validatedConfig = plainToInstance(EnvironmentVariables, normalized, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
};
