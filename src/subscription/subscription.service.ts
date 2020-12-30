import { Injectable, NotFoundException } from '@nestjs/common';
import RandExp from 'randexp';
import { KubeService } from '../kube/kube.service';
import { Service } from '../service/service.entity';
import { ServiceService } from '../service/service.service';
import { Tenant } from '../tenant/tenant.entity';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class SubscriptionService {

  constructor(
    private readonly serviceService: ServiceService,
    private readonly tenantService: TenantService,
    private readonly kubeService: KubeService
  ) {}

  async subscribe({ tenantId, serviceName }) {
    const service: Service = await this.serviceService.getServiceByName({ name: serviceName });
    if (!service) {
      throw new NotFoundException(serviceName, 'service');
    }

    const tenant: Tenant = await this.tenantService.getTenantById(tenantId);
    if (!tenant) {
      throw new NotFoundException(tenantId, 'tenant');
    }

    const manifest = JSON.parse(service.manifest);
    if (manifest.secrets) {
      await this.createServiceSecrets({ tenant, service, secrets: manifest.secrets });
    }

    await this.kubeService.createServiceDeployment({ tenant: tenant.name, manifest });
    await this.kubeService.createService({ tenant, manifest });
  }

  private async createServiceSecrets({ tenant, service, secrets }: { tenant: Tenant, service: Service, secrets: Object }) {
    const secretNames = Object.keys(secrets);
      for (const secretName of secretNames) {
        await this.createServiceSecret({ tenant, service, secret: secrets[secretName], name: secretName });
      }
  }

  private async createServiceSecret({ tenant, service, secret, name }: { tenant: Tenant, service: Service, secret: Object, name: string }) {
    await this.kubeService.createSecret({
      tenant: tenant.name,
      service: service.name,
      name,
      data: this.generateSecretData(secret)
    });
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
