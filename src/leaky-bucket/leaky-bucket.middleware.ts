import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, request } from 'express';

@Injectable()
export class LeakyBucketMiddleware implements NestMiddleware {
  static readonly requestQueue = [];
  static readonly rate = { size: 2, interval: 5000 };
  readonly capacity = 100;
  private readonly logger = new Logger(LeakyBucketMiddleware.name);

  public readonly isFullBucket = () =>
    LeakyBucketMiddleware.requestQueue.length === this.capacity;

  private add(req: Request, res: Response, next: NextFunction): boolean {
    if (this.isFullBucket()) {
      return false;
    }
    LeakyBucketMiddleware.requestQueue.push({ req, res, next });
    return true;
  }

  use(req: Request, res: Response, next: NextFunction): any {
    if (this.add(req, res, next)) {
      this.logger.log(`${req.method} ${req.url} - ${new Date()}`);
    } else {
      throw new ForbiddenException();
    }
  }
}
