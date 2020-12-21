import { Body, Controller, Delete, Post } from '@nestjs/common';
import { CreateTenantDTO, DeleteTenantDTO } from './tenant.interface';
import { TenantService } from './tenant.service';

@Controller('/api/tenant')
export class TenantController {

  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body() dto: CreateTenantDTO) {
    return this.tenantService.create(dto);
  }

  @Delete()
  delete(@Body() dto: DeleteTenantDTO) {
    return this.tenantService.delete(dto);
  }

};
