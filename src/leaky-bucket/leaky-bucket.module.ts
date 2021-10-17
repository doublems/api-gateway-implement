import { Module } from '@nestjs/common';
import { LeakyBucketMiddleware } from './leaky-bucket.middleware';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [LeakyBucketMiddleware],
})
export class LeakyBucketModule {}
