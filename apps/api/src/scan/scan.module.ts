import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { GitHubModule } from '../github/github.module';
import { BotFilterModule } from '../bot-filter/bot-filter.module';
import { ForensicsModule } from '../forensics/forensics.module';
import { ScorerModule } from '../scoring/scorer.module';

@Module({
  imports: [
    GitHubModule,
    BotFilterModule,
    ForensicsModule,
    ScorerModule,
  ],
  controllers: [ScanController],
  providers: [ScanService],
  exports: [ScanService],
})
export class ScanModule {}
