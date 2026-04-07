import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '../.././../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('❌ Missing DATABASE_URL in .env file.');
    }

    const adapter = new PrismaMariaDb(databaseUrl);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
