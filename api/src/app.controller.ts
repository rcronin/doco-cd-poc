import { Controller, Get, Param, Req } from '@nestjs/common';
import * as os from 'os';
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

  @Get('hello/:name')
  hello(@Param('name') name: string) {
    return { message: `Hello, ${name} from ${os.hostname()}!` };
  }
}
