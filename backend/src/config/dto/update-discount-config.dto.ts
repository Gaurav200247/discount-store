import { IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateDiscountConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  n?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  percent?: number;
}
