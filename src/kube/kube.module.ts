import { Module } from '@nestjs/common';
import { BuilderModule } from '../builder/builder.module';
import { KubeService } from './kube.service';

@Module({
  imports: [BuilderModule],
  providers: [KubeService],
  exports: [KubeService]
})
export class KubeModule {};
