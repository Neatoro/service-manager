import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateServiceInstanceDTO, CreateTenantDTO } from './tenant.interface';
import { TenantService } from './tenant.service';

@Controller('/api/tenant')
export class TenantController {

  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body() dto: CreateTenantDTO) {
    return this.tenantService.create(dto);
  }

  @Post('/:tenant')
  createServiceInstance(@Param('tenant') tenant: string, @Body() dto: CreateServiceInstanceDTO) {
    return this.tenantService.createServiceInstance(tenant, dto);
  }

};
