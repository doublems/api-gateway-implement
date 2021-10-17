import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, request } from 'express';

@Injectable()
export class LeakyBucketMiddleware implements NestMiddleware {
  static readonly capacity = 100;
  static readonly rate = { size: 2, interval: 5000 };
  static readonly requestQueue = [];
  static readonly leakyQueue = [];
  static latestWorkTime = Date.now();
  static latestTargetFinishTime =
    LeakyBucketMiddleware.latestWorkTime + LeakyBucketMiddleware.rate.interval;

  public static readonly isFullBucket = () =>
    LeakyBucketMiddleware.requestQueue.length ===
    LeakyBucketMiddleware.capacity;

  public static readonly isLeak = () => {
    if (
      LeakyBucketMiddleware.leakyQueue.length <
        LeakyBucketMiddleware.rate.size &&
      Date.now() - LeakyBucketMiddleware.latestWorkTime <
        LeakyBucketMiddleware.rate.interval
    ) {
      return 'leak';
    }

    if (LeakyBucketMiddleware.leakyQueue.length === 0) {
      return 'init';
    }
  };

  static readonly sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  private static add(req: Request): boolean {
    if (LeakyBucketMiddleware.isFullBucket()) {
      return false;
    }
    console.log('isLeak? ' + req.url + LeakyBucketMiddleware.isLeak());
    if (LeakyBucketMiddleware.isLeak()) {
      LeakyBucketMiddleware.leakyQueue.push(req);
      return true;
    }
    LeakyBucketMiddleware.requestQueue.push(req);
    return true;
  }

  private static async consume(req: Request, intervalId?: any) {
    const index = LeakyBucketMiddleware.leakyQueue.indexOf(req);
    if (index > -1) {
      LeakyBucketMiddleware.leakyQueue.splice(index, 1);
      clearInterval(intervalId);

      // 너무 빨리 끝남
      if (
        LeakyBucketMiddleware.isLeak() === 'init' &&
        LeakyBucketMiddleware.latestTargetFinishTime > Date.now()
      ) {
        const waiting =
          LeakyBucketMiddleware.latestTargetFinishTime - Date.now();
        console.log(waiting);
        await LeakyBucketMiddleware.sleep(waiting);
        console.log('sleep done');
      }

      if (LeakyBucketMiddleware.leakyQueue.length === 0) {
        LeakyBucketMiddleware.latestWorkTime = Date.now();
        LeakyBucketMiddleware.latestTargetFinishTime =
          LeakyBucketMiddleware.latestWorkTime +
          LeakyBucketMiddleware.rate.interval;
      }

      console.log(`Finished : ${req.method} ${req.url} - ${new Date()}`);
      console.log('');
      console.log('');
      return true;
    }

    for (let i = 0; i < LeakyBucketMiddleware.rate.size; i++) {
      LeakyBucketMiddleware.leakyQueue.push(
        LeakyBucketMiddleware.requestQueue.shift(),
      );
    }
    return false;
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<any> {
    console.log(`Start : ${req.method} ${req.url} - ${new Date()}`);
    if (LeakyBucketMiddleware.add(req)) {
      const isConsumed = await LeakyBucketMiddleware.consume(req);
      if (isConsumed) {
        return next();
      } else {
        const intervalId = setInterval(async () => {
          const isConsumed = await LeakyBucketMiddleware.consume(
            req,
            intervalId,
          );
          if (isConsumed) {
            return next();
          }
        }, LeakyBucketMiddleware.rate.interval);
      }
    } else {
      throw new ForbiddenException();
    }
  }
}
