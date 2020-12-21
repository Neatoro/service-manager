import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubeModule } from '../kube/kube.module';
import { Service } from '../service/service.entity';
import { TenantController } from './tenant.controller';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Service]), KubeModule],
  controllers: [TenantController],
  providers: [TenantService]
})
export class TenantModule {};
