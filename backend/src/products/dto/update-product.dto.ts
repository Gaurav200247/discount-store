import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
