import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    const port = this.configService.get<string>('MINIO_PORT') || '9000';
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
    const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin';

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'app-uploads';

    const endpointUrl = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;

    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: 'us-east-1', // MinIO doesn't care about region, but AWS SDK requires it
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.logger.log(`StorageService initialized with endpoint: ${endpointUrl}`);
    this.logger.log(`Bucket name: ${this.bucketName}`);
  }

  /**
   * Generate a presigned URL for uploading a file
   * @param objectKey The key/path for the object in the bucket
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for uploading
   */
  async getUploadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url;
  }

  /**
   * Generate a presigned URL for downloading a file
   * @param objectKey The key/path for the object in the bucket
   * @param expiresIn Expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for downloading
   */
  async getDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
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
   * Get the bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

