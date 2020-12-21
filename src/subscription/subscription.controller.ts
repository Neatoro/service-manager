import { Body, Controller, Post } from '@nestjs/common';
import { CreateSubscriptionDTO } from './subscription.interface';
import { SubscriptionService } from './subscription.service';

@Controller('/api/subscribe')
export class SubscriptionController {

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDTO) {
    return this.subscriptionService.subscribe({
      tenantId: dto.tenant,
      serviceName: dto.service
    });
  }

};
