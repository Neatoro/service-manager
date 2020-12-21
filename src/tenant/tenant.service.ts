import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import RandExp from 'randexp';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { KubeService } from '../kube/kube.service';
import { Service } from '../service/service.entity';
import { Tenant } from './tenant.entity';
import { CreateServiceInstanceDTO, CreateTenantDTO } from './tenant.interface';

@Injectable()
export class TenantService {

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Service) private readonly serviceRepository: Repository<Service>,
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

  async createServiceInstance(tenant: string, dto: CreateServiceInstanceDTO) {
    const fullService: Service = await this.serviceRepository.findOne({ name: dto.service });
    const serviceManifest = JSON.parse(fullService.manifest);

    if (serviceManifest.secrets) {
      const secretNames = Object.keys(serviceManifest.secrets);
      for (const secretName of secretNames) {
        await this.kubeService.createSecret({
          tenant,
          service: fullService.name,
          name: secretName,
          data: this.generateSecretData(serviceManifest.secrets[secretName])
        });
      }
    }

    return await this.kubeService.createServiceDeployment({ tenant, manifest: serviceManifest });
  }

  generateSecretData(data) {
    const keys = Object.keys(data);
    const generatedData = {};
    for (const key of keys) {
      const config = data[key];
      if (config.generated) {
        const randExp = new RandExp(config.generated);
        generatedData[key] = randExp.gen();
      } else if (config.static) {
        generatedData[key] = config.static;
      }
    }
    return generatedData;
  }

};
