import { Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";

@ApiTags("admin")
@Controller("admin")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @ApiOperation({ summary: "Generate a discount coupon" })
  @Post("coupons")
  generate() {
    return this.couponsService.generate();
  }
}
