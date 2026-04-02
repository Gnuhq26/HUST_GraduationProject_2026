import { Module } from '@nestjs/common';
import { AiAnalystService } from './ai-analyst.service';
import { AiAnalystController } from './ai-analyst.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiAnalystController],
  providers: [AiAnalystService],
})
export class AiAnalystModule {}
