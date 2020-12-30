import { AppsV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BuilderServiceFactory } from '../builder/builder.factory';
import { BuilderService } from '../builder/builder.interface';
import { Tenant } from '../tenant/tenant.entity';

@Injectable()
export class KubeService {

  private client: CoreV1Api;
  private appsClient: AppsV1Api;
  private builderService: BuilderService;

  constructor(
    configService: ConfigService,
    builderServiceFactory: BuilderServiceFactory
  ) {
    this.builderService = builderServiceFactory.getService();

    const config: KubeConfig = new KubeConfig();
    config.addCluster({ name: 'default', server: 'https://' + configService.get('KUBE_HOST'), skipTLSVerify: true });
    config.addUser({ name: 'service-manager-access', token: configService.get('KUBE_ACCESS_TOKEN') });
    config.addContext({ name: 'default', cluster: 'default', user: 'service-manager-access' });
    config.setCurrentContext('default');

    this.client = config.makeApiClient(CoreV1Api);
    this.appsClient = config.makeApiClient(AppsV1Api);
  }

  async createNamespace({ name }) {
    try {
      await this.client.createNamespace({
        metadata: { name }
      });
    } catch (e) {
      throw e;
    }
  }

  async deleteNamespace(name) {
    await this.client.deleteNamespace(name);
  }

  async createSecret({ tenant, service, name, data }) {
    const fullname = `${service}-${name}-secret`;

    const secrets = (await this.client.listNamespacedSecret(tenant)).body;

    const secret = secrets.items.find((secret) => secret.metadata.name === fullname);

    if (secret && this.isSameData({ oldSecretData: secret.data, newSecretData: data })) {
      await this.client.deleteNamespacedSecret(fullname, tenant);
    } else if (secret) {
      return;
    }

    await this.client.createNamespacedSecret(tenant, {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: fullname
      },
      type: 'Opaque',
      data: this.encryptData({ data })
    });
  }

  encryptData({ data }) {
    const keys = Object.keys(data);
    return keys.reduce((prev, current) => ({ ...prev, [current]: Buffer.from(data[current]).toString('base64') }), {});
  }

  isSameData({ oldSecretData, newSecretData }) {
    const oldKeys = Object.keys(oldSecretData);
    const newKeys = Object.keys(newSecretData);

    return oldKeys.length === newKeys.length &&
      newKeys.reduce((prev, cur) => prev && oldKeys.includes(cur), true);
  }

  createContainerConfig({ service, containerManifest }) {
    return {
      name: containerManifest.name,
      image: containerManifest.image,
      ports: containerManifest.ports.map((port) => ({ containerPort: Number(port) })),
      args: containerManifest.args,
      env: Object
        .keys(containerManifest.env)
        .map((key) => this.transformEnvVariableFromManifest({ service, name: key, manifest: containerManifest.env[key] }))
    };
  }

  transformEnvVariableFromManifest({ service, name, manifest }) {
    if (manifest.static) {
      return { name, value: String(manifest.static) };
    } else if (manifest.secret) {
      const secret = manifest.secret;
      return {
        name,
        valueFrom: {
          secretKeyRef: {
            name: `${service}-${secret.name}-secret`,
            key: secret.key
          }
        }
      };
    }
  }

  async createServiceDeployment({ tenant, manifest }) {
    const additionalContainers = [];
    if (manifest.containers) {
      for (const container of manifest.containers) {
        additionalContainers.push(this.createContainerConfig({
          service: manifest.name,
          containerManifest: container
        }));
      }
    }

    await this.appsClient.createNamespacedDeployment(tenant, {
      metadata: {
        name: `${manifest.name}-deployment`,
        labels: {
          app: manifest.name
        }
      },
      spec: {
        selector:{
          matchLabels: {
            app: manifest.name
          }
        },
        template: {
          metadata: {
            labels: {
              app: manifest.name
            }
          },
          spec: {
            restartPolicy: 'Always',
            containers: [
              ...additionalContainers,
              {
                name: manifest.name,
                imagePullPolicy: this.builderService.getImagePollPolicy(),
                command: this.builderService.getStartParameters(manifest),
                image: this.builderService.getImageName(manifest.name),
                ports: manifest.ports.map((port) => ({ containerPort: Number(port) })),
                env: Object
                  .keys(manifest.env)
                  .map((key) => this.transformEnvVariableFromManifest({ service: manifest.name, name: key, manifest: manifest.env[key] }))
              }
            ]
          }
        }
      }
    })
  }

  async createService({ tenant, manifest }: { tenant: Tenant, manifest: any }) {
    await this.client.createNamespacedService(tenant.name, {
      metadata: {
        name: `${manifest.name}-service`
      },
      spec: {
        ports: manifest.ports.map((port) => ({ port, targetPort: port })),
        selector: {
          app: manifest.name
        }
      }
    });
  }

};
