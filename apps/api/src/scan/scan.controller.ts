import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ScanService } from './scan.service';

class StartScanDto {
  repoUrl: string;
}

@Controller()
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'GitForensics API Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async startScan(@Body() body: StartScanDto) {
    if (!body || !body.repoUrl) {
      throw new BadRequestException('repoUrl is required.');
    }
    return this.scanService.startScan(body.repoUrl);
  }

  @Get('scan/:id')
  getScanStatus(@Param('id') id: string) {
    return this.scanService.getScanStatus(id);
  }

  @Get('report/:owner/:repo')
  getReportByRepo(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.scanService.getReportByRepo(owner, repo);
  }

  @Get('recent')
  getRecentScans() {
    return this.scanService.getRecentScans();
  }
}
