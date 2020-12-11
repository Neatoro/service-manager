import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ServiceService } from "./service.service";

@Controller('/api/service')
export class ServiceController {

  constructor(private readonly serviceService: ServiceService) {}

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
    }

    this.serviceService.buildImage({ service, manifest, data });
    return service;
  }

};
