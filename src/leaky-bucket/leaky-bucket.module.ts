import { Module } from '@nestjs/common';
import { LeakyBucketMiddleware } from './leaky-bucket.middleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [LeakyBucketMiddleware],
})
export class LeakyBucketModule {}
