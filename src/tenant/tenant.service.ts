import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { KubeService } from '../kube/kube.service';
import { Service } from '../service/service.entity';
import { Tenant } from './tenant.entity';
import { CreateTenantDTO, DeleteTenantDTO } from './tenant.interface';

@Injectable()
export class TenantService {

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    private readonly connection: Connection,
    private readonly kubeService: KubeService
  ) {}

  async create(dto: CreateTenantDTO) {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dbTenant = this.tenantRepository.create(dto);

      const tenant = await queryRunner.manager.save(dbTenant);
      await this.kubeService.createNamespace({ name: tenant.name });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return tenant;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw e;
    }
  }

  async delete(dto: DeleteTenantDTO) {
    const tenant: Tenant = await this.tenantRepository.findOne(dto.id);
    if (!tenant) {
      throw new NotFoundException(dto.id, 'tenant');
    }

    const queryRunner: QueryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Tenant, { id: dto.id });
      await this.kubeService.deleteNamespace(tenant.name);

      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw e;
    }
  }

  getTenantById(id): Promise<Tenant> {
    return this.tenantRepository.findOne(id);
  }

};
