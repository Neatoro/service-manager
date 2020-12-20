import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalBuilder } from './localbuilder.service';
import { RemoteBuilder } from './remotebuilder.service';

@Injectable()
export class BuilderServiceFactory {

  constructor(private readonly configService: ConfigService) {}

  getService() {
    if (this.configService.get('NODE_ENV') === 'dev') {
      return LocalBuilder.getInstance();
    } else {
      return RemoteBuilder.getInstance(this.configService);
    }
  }

};
