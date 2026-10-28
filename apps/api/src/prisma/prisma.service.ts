import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      if (process.env.DATABASE_URL) {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('✅ Connected to PostgreSQL database via Prisma.');
      } else {
        this.logger.warn('⚠️ No DATABASE_URL provided. Operating with in-memory persistence fallback.');
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ PostgreSQL connection not established (${err.message}). Using resilient in-memory store.`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
