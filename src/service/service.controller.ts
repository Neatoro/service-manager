import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BuilderServiceFactory } from '../builder/builder.factory';
import { BuilderService } from '../builder/builder.interface';
import { ServiceService } from './service.service';

@Controller('/api/service')
export class ServiceController {

  private builderService: BuilderService;

  constructor(
    private readonly serviceService: ServiceService,
    builderFactory: BuilderServiceFactory
  ) {
    this.builderService = builderFactory.getService();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file) {
    const buffer: Buffer = file.buffer;
    const manifestLength = buffer.readInt32BE();
    const manifestString = buffer.slice(4, manifestLength + 4).toString('utf-8');
    const manifest = JSON.parse(manifestString);
    const data = buffer.slice(manifestLength + 4);

    let service = await this.serviceService.getServiceByName({ name: manifest.name });
    if (!service) {
      service = await this.serviceService.create({ name: manifest.name, manifest });
    } else {
      service = await this.serviceService.update({ service, manifest });
    }

    this.builderService.buildImage({ service, manifest, data });
    return service;
  }

  @Get()
  catalog() {
    return this.serviceService.catalog();
  }

};
