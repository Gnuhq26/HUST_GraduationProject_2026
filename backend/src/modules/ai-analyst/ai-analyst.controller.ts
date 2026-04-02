import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAnalystService } from './ai-analyst.service';
import { CurrentStore } from '../../common/decorators';
import { CheckPermission } from '../../common/decorators/check-permission.decorator';

@ApiTags('AI Analyst')
@ApiBearerAuth('JWT-auth')
@Controller('ai-analyst')
export class AiAnalystController {
  constructor(private readonly aiAnalystService: AiAnalystService) {}

  @Get('insights')
  @CheckPermission('read', 'AiAnalyst')
  @ApiOperation({ summary: 'Lấy phân tích & lời khuyên kinh doanh từ AI' })
  async getInsights(@CurrentStore() storeId: number) {
    return this.aiAnalystService.generateInsights(storeId);
  }
}
