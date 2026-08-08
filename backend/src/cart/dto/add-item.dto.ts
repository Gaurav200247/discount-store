import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class AddItemDto {
  @IsString()
  @IsOptional()
  cartId?: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
