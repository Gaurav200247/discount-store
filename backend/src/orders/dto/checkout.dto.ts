import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  cartId!: string;

  @IsString()
  @IsOptional()
  couponCode?: string;
}
