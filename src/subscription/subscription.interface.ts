import { IsNotEmpty } from "class-validator";

export class CreateSubscriptionDTO {

  @IsNotEmpty()
  service: string;

  @IsNotEmpty()
  tenant: string;

};
