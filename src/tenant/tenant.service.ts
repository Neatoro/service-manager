import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDTO } from './tenant.interface';

@Injectable()
export class TenantService {

  constructor(@InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>) {}

  create(dto: CreateTenantDTO) {
    return this.tenantRepository.save(dto);
  }

};
