import { Module } from '@nestjs/common';
import { KubeService } from './kube.service';

@Module({
  providers: [KubeService],
  exports: [KubeService]
})
export class KubeModule {};
