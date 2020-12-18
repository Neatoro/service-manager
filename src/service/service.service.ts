import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { resolve as resolvePath } from 'path';
import { Repository } from 'typeorm';
import { promisify } from 'util';
import { Service } from './service.entity';

const runCommand = promisify(exec);

const images = {
  node: 'docker/node'
};

@Injectable()
export class ServiceService {

  private registry: string;

  constructor(
    @InjectRepository(Service) private readonly serviceRepository: Repository<Service>,
    configService: ConfigService
  ) {
    this.registry = configService.get('REGISTRY');
  }

  async create({ name, manifest }) {
    const result = await this.serviceRepository.save({
      name,
      manifest: JSON.stringify(manifest)
    });
    return result;
  }

  async update({ service, manifest }) {
    service.manifest = JSON.stringify(manifest);
    return await this.serviceRepository.save(service);
  }

  async catalog() {
    return await this.serviceRepository.find();
  }

  async getServiceByName({ name }) {
    const result = await this.serviceRepository.find({ name });
    return result[0];
  }

  async buildImage({ service, manifest, data }) {
    const tempDir = resolvePath(process.cwd(), `temp/${service.id}/${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(resolvePath(tempDir, 'app.zip'), data);

    await runCommand(this.getBuildCommand({ tempDir, type: manifest.type, name: service.name }));
  }

  getBuildCommand({ tempDir, type, name }): string {
    const image = images[type];
    return `buildctl build --frontend=dockerfile.v0 --local context=${tempDir} --local dockerfile=${image} --output type=image,name=${this.registry}/${name},push=true,registry.insecure=true`;
  }

};
