import { Module } from '@nestjs/common';
import { KubeModule } from '../kube/kube.module';
import { ServiceModule } from '../service/service.module';
import { TenantModule } from '../tenant/tenant.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [TenantModule, ServiceModule, KubeModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService]
})
export class SubscriptionModule {};
