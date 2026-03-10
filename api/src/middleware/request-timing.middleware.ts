import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithStart extends Request {
  _start?: number;
}

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(req: RequestWithStart, res: Response, next: NextFunction) {
    req._start = Date.now();
    next();
  }
}
