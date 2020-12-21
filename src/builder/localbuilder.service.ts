import { BuilderService } from './builder.interface';

export class LocalBuilder extends BuilderService {

  private static instance: LocalBuilder;

  private constructor() {
    super();
  }

  static getInstance(): LocalBuilder {
    if (!LocalBuilder.instance) {
      LocalBuilder.instance = new LocalBuilder();
    }
    return LocalBuilder.instance;
  }

  getBuildCommand({ tempDir, type, manifest }) {
    const image = this.imageTypes[type];
    return `docker build -t ${this.getImageName(manifest.name)} --build-arg main=${manifest.main} -f ${image}/Dockerfile ${tempDir}`;
  }

  getImageName(service) {
    return service;
  }

  getImagePollPolicy() {
    return 'Never';
  }

};
