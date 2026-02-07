import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client; // Internal client for backend operations (uses Docker service name)
  private readonly s3ClientExternal: S3Client; // External client for presigned URLs (uses localhost for frontend)
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Internal endpoint (for backend → MinIO communication within Docker)
    const internalEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const internalPort = this.configService.get<string>('MINIO_PORT') || '9000';
    
    // External endpoint (for presigned URLs used by frontend)
    const externalEndpoint = this.configService.get<string>('MINIO_EXTERNAL_ENDPOINT') || 'localhost';
    const externalPort = this.configService.get<string>('MINIO_EXTERNAL_PORT') || '9000';
    
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin';

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'app-uploads';

    const internalEndpointUrl = `${useSSL ? 'https' : 'http'}://${internalEndpoint}:${internalPort}`;
    const externalEndpointUrl = `${useSSL ? 'https' : 'http'}://${externalEndpoint}:${externalPort}`;

    // Internal client for backend operations (delete, copy, move, list, metadata)
    this.s3Client = new S3Client({
      endpoint: internalEndpointUrl,
      region: 'us-east-1', // MinIO doesn't care about region, but AWS SDK requires it
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    // External client for presigned URLs (frontend will use these URLs)
    this.s3ClientExternal = new S3Client({
      endpoint: externalEndpointUrl,
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.logger.log(`StorageService initialized with internal endpoint: ${internalEndpointUrl}`);
    this.logger.log(`StorageService initialized with external endpoint: ${externalEndpointUrl}`);
    this.logger.log(`Bucket name: ${this.bucketName}`);
  }

  /**
   * Generate a presigned URL for uploading a file
   * Uses external endpoint so frontend can access it from outside Docker
   * @param objectKey The key/path for the object in the bucket
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for uploading
   */
  async getUploadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    // Use external client for presigned URLs (frontend will use these)
    const url = await getSignedUrl(this.s3ClientExternal, command, { expiresIn });
    return url;
  }

  /**
   * Generate a presigned URL for downloading a file
   * Uses external endpoint so frontend can access it from outside Docker
   * @param objectKey The key/path for the object in the bucket
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for downloading
   */
  async getDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    // Use external client for presigned URLs (frontend will use these)
    const url = await getSignedUrl(this.s3ClientExternal, command, { expiresIn });
    return url;
  }

  /**
   * Delete an object from the bucket
   * @param objectKey The key/path for the object in the bucket
   */
  async deleteObject(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted object: ${objectKey}`);
  }

  /**
   * Copy an object to a new location (used for moving files)
   * @param sourceKey The source object key
   * @param destinationKey The destination object key
   */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.s3Client.send(command);
    this.logger.log(`Copied object from ${sourceKey} to ${destinationKey}`);
  }

  /**
   * Move an object to a new location (copy + delete)
   * @param sourceKey The source object key
   * @param destinationKey The destination object key
   */
  async moveObject(sourceKey: string, destinationKey: string): Promise<void> {
    // Copy the object
    await this.copyObject(sourceKey, destinationKey);
    // Delete the source object
    await this.deleteObject(sourceKey);
    this.logger.log(`Moved object from ${sourceKey} to ${destinationKey}`);
  }

  /**
   * List objects with a given prefix
   * @param prefix The prefix to filter objects
   * @returns Array of object keys
   */
  async listObjects(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    return (response.Contents || []).map((obj) => obj.Key || '').filter(Boolean);
  }

  /**
   * Get object metadata (including LastModified date)
   * @param objectKey The object key
   * @returns Object metadata or null if not found
   */
  async getObjectMetadata(objectKey: string): Promise<{ lastModified: Date } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.s3Client.send(command);
      if (response.LastModified) {
        return { lastModified: response.LastModified };
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get metadata for ${objectKey}:`, error);
      return null;
    }
  }

  /**
   * Get the bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

