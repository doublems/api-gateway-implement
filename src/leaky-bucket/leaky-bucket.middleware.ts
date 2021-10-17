import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, request } from 'express';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class LeakyBucketMiddleware implements NestMiddleware {
  static readonly capacity = 100;
  static readonly rate = { size: 2, interval: 5000 };
  static readonly requestQueue = [];

  public static readonly isFullBucket = () =>
    LeakyBucketMiddleware.requestQueue.length ===
    LeakyBucketMiddleware.capacity;

  private static add(req: Request, res: Response, next: NextFunction): boolean {
    if (LeakyBucketMiddleware.isFullBucket()) {
      return false;
    }
    LeakyBucketMiddleware.requestQueue.push({ req, res, next });
    return true;
  }

  private static consume() {
    setInterval(() => {
      for (let i = 0; i < LeakyBucketMiddleware.rate.size; i++) {
        const job = LeakyBucketMiddleware.requestQueue.shift();
        job?.next();
      }
    }, LeakyBucketMiddleware.rate.interval);
  }

  use(req: Request, res: Response, next: NextFunction): any {
    console.log(`${req.method} ${req.url} - ${new Date()}`);
    if (LeakyBucketMiddleware.add(req, res, next)) {
      return LeakyBucketMiddleware.consume();
    } else {
      throw new ForbiddenException();
    }
  }
}
