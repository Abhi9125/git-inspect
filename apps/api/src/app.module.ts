import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GitHubModule } from './github/github.module';
import { BotFilterModule } from './bot-filter/bot-filter.module';
import { ForensicsModule } from './forensics/forensics.module';
import { ScorerModule } from './scoring/scorer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    GitHubModule,
    BotFilterModule,
    ForensicsModule,
    ScorerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
