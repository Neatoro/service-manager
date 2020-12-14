import { Body, Controller, Post } from '@nestjs/common';
import { CreateTenantDTO } from './tenant.interface';
import { TenantService } from './tenant.service';

@Controller('/api/tenant')
export class TenantController {

  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body() dto: CreateTenantDTO) {
    return this.tenantService.create(dto);
  }

};
