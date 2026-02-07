import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DeletionRetryService {
  private readonly logger = new Logger(DeletionRetryService.name);
  private readonly MAX_RETRIES = 5; // Maximum number of retry attempts

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Record a failed deletion for later retry
   */
  async recordFailedDeletion(objectKey: string, error: Error): Promise<void> {
    try {
      // Check if a failed deletion record already exists
      const existing = await this.prisma.failedDeletion.findUnique({
        where: { objectKey },
      });

      if (existing) {
        // Update existing record
        await this.prisma.failedDeletion.update({
          where: { objectKey },
          data: {
            retryCount: existing.retryCount + 1,
            lastError: error.message,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new record
        await this.prisma.failedDeletion.create({
          data: {
            objectKey,
            retryCount: 1,
            lastError: error.message,
          },
        });
      }
    } catch (err) {
      // Log but don't throw - we don't want to fail the attachment deletion
      this.logger.error(`Failed to record failed deletion for ${objectKey}:`, err);
    }
  }

  /**
   * Retry failed deletions (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedDeletions(): Promise<void> {
    this.logger.log('Starting retry of failed deletions...');

    try {
      // Get all failed deletions that haven't exceeded max retries
      const failedDeletions = await this.prisma.failedDeletion.findMany({
        where: {
          retryCount: {
            lt: this.MAX_RETRIES,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (failedDeletions.length === 0) {
        this.logger.log('No failed deletions to retry');
        return;
      }

      this.logger.log(`Found ${failedDeletions.length} failed deletion(s) to retry`);

      let successCount = 0;
      let failureCount = 0;

      for (const failedDeletion of failedDeletions) {
        try {
          // Attempt to delete from storage
          await this.storageService.deleteObject(failedDeletion.objectKey);

          // Success! Remove from failed deletions table
          await this.prisma.failedDeletion.delete({
            where: { id: failedDeletion.id },
          });

          this.logger.log(`Successfully deleted ${failedDeletion.objectKey} on retry`);
          successCount++;
        } catch (error) {
          // Update retry count and error message
          await this.prisma.failedDeletion.update({
            where: { id: failedDeletion.id },
            data: {
              retryCount: failedDeletion.retryCount + 1,
              lastError: error instanceof Error ? error.message : String(error),
              updatedAt: new Date(),
            },
          });

          this.logger.warn(
            `Failed to delete ${failedDeletion.objectKey} on retry ${failedDeletion.retryCount + 1}/${this.MAX_RETRIES}:`,
            error instanceof Error ? error.message : String(error)
          );
          failureCount++;

          // If max retries reached, log and keep the record for manual review
          if (failedDeletion.retryCount + 1 >= this.MAX_RETRIES) {
            this.logger.error(
              `Max retries reached for ${failedDeletion.objectKey}. Manual intervention may be required.`
            );
          }
        }
      }

      this.logger.log(
        `Retry completed: ${successCount} succeeded, ${failureCount} failed`
      );
    } catch (error) {
      this.logger.error('Error during retry of failed deletions:', error);
    }
  }

  /**
   * Manually retry a specific deletion (can be called from admin interface)
   */
  async retryDeletion(objectKey: string): Promise<boolean> {
    const failedDeletion = await this.prisma.failedDeletion.findUnique({
      where: { objectKey },
    });

    if (!failedDeletion) {
      throw new Error(`No failed deletion record found for ${objectKey}`);
    }

    try {
      await this.storageService.deleteObject(objectKey);
      await this.prisma.failedDeletion.delete({
        where: { id: failedDeletion.id },
      });
      this.logger.log(`Successfully deleted ${objectKey} on manual retry`);
      return true;
    } catch (error) {
      await this.prisma.failedDeletion.update({
        where: { id: failedDeletion.id },
        data: {
          retryCount: failedDeletion.retryCount + 1,
          lastError: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        },
      });
      this.logger.warn(`Failed to delete ${objectKey} on manual retry:`, error);
      return false;
    }
  }
}


