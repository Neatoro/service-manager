import { CoreV1Api, KubeConfig } from '@kubernetes/client-node';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KubeService {

  private client: CoreV1Api;

  constructor(configService: ConfigService) {
    const config: KubeConfig = new KubeConfig();
    config.addCluster({ name: 'default', server: 'https://' + configService.get('KUBE_HOST'), skipTLSVerify: true });
    config.addUser({ name: 'service-manager-access', token: configService.get('KUBE_ACCESS_TOKEN') });
    config.addContext({ name: 'default', cluster: 'default', user: 'service-manager-access' });
    config.setCurrentContext('default');

    this.client = config.makeApiClient(CoreV1Api);
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

};
