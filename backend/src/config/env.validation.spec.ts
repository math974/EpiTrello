import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('env.validation', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
    JWT_SECRET: 'test-secret',
  };

  it('should validate a valid configuration', () => {
    const config = {
      ...baseConfig,
      JWT_REFRESH_SECRET: 'refresh-secret',
      CORS_ORIGIN: 'http://localhost:3000',
      PORT: '4000',
    };

    expect(() => validateEnv(config)).not.toThrow();
    const result = validateEnv(config);
    expect(result.DATABASE_URL).toBe('postgresql://user:password@localhost:5432/db');
    expect(result.JWT_SECRET).toBe('test-secret');
    expect(result.JWT_REFRESH_SECRET).toBe('refresh-secret');
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000');
    // PORT is optional string, so it remains as string even with enableImplicitConversion
    expect(result.PORT).toBe('4000');
  });

  it('should throw error when DATABASE_URL is missing', () => {
    const config = {
      JWT_SECRET: 'test-secret',
    };

    expect(() => validateEnv(config)).toThrow('Environment validation failed');
  });

  it('should throw error when JWT_SECRET is missing', () => {
    const config = {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
    };

    expect(() => validateEnv(config)).toThrow('Environment validation failed');
  });

  it('should normalize empty strings to undefined', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000', // Required, so we provide a valid value
      PORT: '',
    };

    const result = validateEnv(config);
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000');
    // When PORT is empty string, it's normalized to undefined, then defaulted to 4000
    // But class-transformer keeps it as string type
    expect(result.PORT).toBe('4000');
  });

  it('should set default PORT to 4000 when undefined', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000',
    };

    const result = validateEnv(config);
    // PORT defaults to 4000, but class-transformer keeps it as string type
    expect(result.PORT).toBe('4000');
  });

  it('should validate MinIO configuration', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000',
      MINIO_ENDPOINT: 'minio',
      MINIO_PORT: '9000',
      MINIO_EXTERNAL_ENDPOINT: 'localhost',
      MINIO_EXTERNAL_PORT: '9000',
      MINIO_ACCESS_KEY: 'minioadmin',
      MINIO_SECRET_KEY: 'minioadmin',
      MINIO_BUCKET_NAME: 'app-uploads',
      MINIO_USE_SSL: 'false',
    };

    expect(() => validateEnv(config)).not.toThrow();
    const result = validateEnv(config);
    expect(result.MINIO_ENDPOINT).toBe('minio');
    expect(result.MINIO_PORT).toBe('9000');
    expect(result.MINIO_BUCKET_NAME).toBe('app-uploads');
  });

  it('should validate OAuth configuration', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GITHUB_CLIENT_ID: 'github-client-id',
      GITHUB_CLIENT_SECRET: 'github-client-secret',
      OAUTH_REDIRECT_URI: 'http://localhost:4000/auth/{provider}/callback',
    };

    expect(() => validateEnv(config)).not.toThrow();
    const result = validateEnv(config);
    expect(result.GOOGLE_CLIENT_ID).toBe('google-client-id');
    expect(result.GITHUB_CLIENT_ID).toBe('github-client-id');
    expect(result.OAUTH_REDIRECT_URI).toBe('http://localhost:4000/auth/{provider}/callback');
  });

  it('should handle optional fields as undefined', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000', // Required field
    };

    const result = validateEnv(config);
    expect(result.JWT_REFRESH_SECRET).toBeUndefined();
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000'); // Required, so it has a value
    expect(result.MINIO_ENDPOINT).toBeUndefined();
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it('should keep PORT as string when provided as string', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000',
      PORT: '5000',
    };

    const result = validateEnv(config);
    // PORT is optional string, so class-transformer keeps it as string
    expect(result.PORT).toBe('5000');
  });

  it('should trim and normalize whitespace-only strings', () => {
    const config = {
      ...baseConfig,
      CORS_ORIGIN: 'http://localhost:3000', // Required, so we provide a valid value instead of whitespace
      PORT: '   ',
    };

    const result = validateEnv(config);
    expect(result.CORS_ORIGIN).toBe('http://localhost:3000');
    // When PORT is empty/whitespace, it's normalized to undefined, then defaulted to 4000
    // But class-transformer keeps it as string type
    expect(result.PORT).toBe('4000');
  });
});

