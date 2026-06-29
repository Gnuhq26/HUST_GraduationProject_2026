import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'refresh', required: false, description: 'true = bỏ qua cache và gọi lại AI' })
  async getInsights(
    @CurrentStore() storeId: number,
    @Query('refresh') refresh?: string,
  ) {
    return this.aiAnalystService.generateInsights(storeId, refresh === 'true');
  }
}
