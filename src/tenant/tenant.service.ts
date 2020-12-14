import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubeService } from '../kube/kube.service';
import { Tenant } from './tenant.entity';
import { CreateTenantDTO } from './tenant.interface';

@Injectable()
export class TenantService {

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    private readonly kubeService: KubeService
  ) {}

  async create(dto: CreateTenantDTO) {
    const tenant = await this.tenantRepository.save(dto);
    this.kubeService.createNamespace({ name: tenant.name });
    return tenant;
  }

};
