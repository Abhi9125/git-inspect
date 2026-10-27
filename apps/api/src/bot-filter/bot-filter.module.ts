import { Module } from '@nestjs/common';
import { BotFilterService } from './bot-filter.service';

@Module({
  providers: [BotFilterService],
  exports: [BotFilterService],
})
export class BotFilterModule {}
