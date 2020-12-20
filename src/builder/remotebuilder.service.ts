import { ConfigService } from '@nestjs/config';
import { BuilderService } from './builder.interface';

export class RemoteBuilder extends BuilderService {

  private static instance: RemoteBuilder;
  private registry: string;

  private constructor(configService: ConfigService) {
    super();
    this.registry = configService.get('REGISTRY');
  }

  static getInstance(configService: ConfigService): RemoteBuilder {
    if (!RemoteBuilder.instance) {
      RemoteBuilder.instance = new RemoteBuilder(configService);
    }
    return RemoteBuilder.instance;
  }

  getBuildCommand({ tempDir, type, name }): string {
    const image = this.imageTypes[type];
    return `buildctl build --frontend=dockerfile.v0 --local context=${tempDir} --local dockerfile=${image} --output type=image,name=${this.getImageName(name)},push=true,registry.insecure=true`;
  }

  getImageName(service) {
    return `${this.registry}/${service}`;
  }

};
