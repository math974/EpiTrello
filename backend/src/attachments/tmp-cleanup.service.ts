import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TmpCleanupService {
  private readonly logger = new Logger(TmpCleanupService.name);
  private readonly TMP_PREFIX = 'tmp/';
  private readonly MAX_AGE_HOURS = 24; // Delete files older than 24 hours

  constructor(private readonly storageService: StorageService) {}

  /**
   * Clean up orphaned files in tmp/ folder (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOrphanedFiles(): Promise<void> {
    this.logger.log('Starting cleanup of orphaned files in tmp/ folder...');

    try {
      // List all objects in tmp/ folder
      const tmpObjects = await this.storageService.listObjects(this.TMP_PREFIX);

      if (tmpObjects.length === 0) {
        this.logger.log('No files found in tmp/ folder');
        return;
      }

      this.logger.log(`Found ${tmpObjects.length} file(s) in tmp/ folder`);

      const now = new Date();
      const maxAge = this.MAX_AGE_HOURS * 60 * 60 * 1000; // Convert to milliseconds
      let deletedCount = 0;
      let errorCount = 0;

      for (const objectKey of tmpObjects) {
        try {
          // Get object metadata to check last modified date
          const metadata = await this.storageService.getObjectMetadata(objectKey);

          if (!metadata) {
            // If we can't get metadata, assume it's old and delete it
            this.logger.warn(`Cannot get metadata for ${objectKey}, deleting anyway`);
            await this.storageService.deleteObject(objectKey);
            deletedCount++;
            continue;
          }

          const age = now.getTime() - metadata.lastModified.getTime();

          if (age > maxAge) {
            // File is older than 24 hours, delete it
            await this.storageService.deleteObject(objectKey);
            this.logger.log(`Deleted orphaned file: ${objectKey} (age: ${Math.round(age / 1000 / 60 / 60)} hours)`);
            deletedCount++;
          } else {
            // File is still recent, keep it
            const ageHours = Math.round(age / 1000 / 60 / 60);
            this.logger.debug(`Keeping file ${objectKey} (age: ${ageHours} hours)`);
          }
        } catch (error) {
          this.logger.error(`Error processing ${objectKey}:`, error);
          errorCount++;
        }
      }

      this.logger.log(
        `Cleanup completed: ${deletedCount} deleted, ${tmpObjects.length - deletedCount - errorCount} kept, ${errorCount} errors`
      );
    } catch (error) {
      this.logger.error('Error during cleanup of orphaned files:', error);
    }
  }

  /**
   * Manually trigger cleanup (can be called from admin interface)
   */
  async manualCleanup(): Promise<{ deleted: number; kept: number; errors: number }> {
    this.logger.log('Manual cleanup triggered');

    try {
      const tmpObjects = await this.storageService.listObjects(this.TMP_PREFIX);

      if (tmpObjects.length === 0) {
        return { deleted: 0, kept: 0, errors: 0 };
      }

      const now = new Date();
      const maxAge = this.MAX_AGE_HOURS * 60 * 60 * 1000;
      let deletedCount = 0;
      let keptCount = 0;
      let errorCount = 0;

      for (const objectKey of tmpObjects) {
        try {
          const metadata = await this.storageService.getObjectMetadata(objectKey);

          if (!metadata) {
            await this.storageService.deleteObject(objectKey);
            deletedCount++;
            continue;
          }

          const age = now.getTime() - metadata.lastModified.getTime();

          if (age > maxAge) {
            await this.storageService.deleteObject(objectKey);
            deletedCount++;
          } else {
            keptCount++;
          }
        } catch (error) {
          this.logger.error(`Error processing ${objectKey}:`, error);
          errorCount++;
        }
      }

      return { deleted: deletedCount, kept: keptCount, errors: errorCount };
    } catch (error) {
      this.logger.error('Error during manual cleanup:', error);
      throw error;
    }
  }
}

