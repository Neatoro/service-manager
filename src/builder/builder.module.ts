import { Module } from '@nestjs/common';
import { BuilderServiceFactory } from './builder.factory';

@Module({
  providers: [BuilderServiceFactory],
  exports: [BuilderServiceFactory]
})
export class BuilderModule {};
