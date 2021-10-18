import { Module } from '@nestjs/common';
import { LeakyBucketMiddleware } from './leaky-bucket.middleware';

@Module({
  providers: [LeakyBucketMiddleware],
})
export class LeakyBucketModule {}
