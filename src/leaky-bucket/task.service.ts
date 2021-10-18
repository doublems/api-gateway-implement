import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { LeakyBucketMiddleware } from './leaky-bucket.middleware';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private static readonly rate = LeakyBucketMiddleware.rate;

  @Interval(TaskService.rate.interval)
  private consume() {
    this.logger.log('leak.. ' + LeakyBucketMiddleware.requestQueue.length);
    for (let i = 0; i < TaskService.rate.size; i++) {
      const job = LeakyBucketMiddleware.requestQueue.shift();
      job?.next();
    }
  }
}
