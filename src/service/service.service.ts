import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServiceService {

  constructor(@InjectRepository(Service) private readonly serviceRepository: Repository<Service>) {}

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

};
