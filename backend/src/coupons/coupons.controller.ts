import { Controller, Post } from "@nestjs/common";
import { CouponsService } from "./coupons.service";

@Controller("admin")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post("coupons")
  generate() {
    return this.couponsService.generate();
  }
}
