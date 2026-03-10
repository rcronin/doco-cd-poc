import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestWithStart } from './middleware/request-timing.middleware';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(@Req() req: RequestWithStart) {
    const start = req._start ?? Date.now();
    return this.appService.getInfo(start);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
