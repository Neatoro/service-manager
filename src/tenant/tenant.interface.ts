import { IsNotEmpty } from "class-validator";

export class CreateTenantDTO {

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  baseHost: string;

};

export class CreateServiceInstanceDTO {

  service: string;

};
