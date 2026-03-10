import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getInfo(requestStartTime: number): { time: string; hostname: string; durationMs: number } {
    const now = new Date();
    const durationMs = Date.now() - requestStartTime;
    return {
      time: now.toISOString(),
      hostname: os.hostname(),
      durationMs,
    };
  }
}
