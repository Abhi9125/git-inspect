import { Module } from '@nestjs/common';
import { ForensicsService } from './forensics.service';

@Module({
  providers: [ForensicsService],
  exports: [ForensicsService],
})
export class ForensicsModule {}
