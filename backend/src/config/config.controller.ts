import { Body, Controller, Get, Patch } from "@nestjs/common";
import { DiscountConfigService } from "./discount.config";
import { UpdateDiscountConfigDto } from "./dto/update-discount-config.dto";

@Controller("admin/config")
export class ConfigController {
  constructor(private readonly config: DiscountConfigService) {}

  @Get()
  getConfig() {
    return { n: this.config.n, percent: this.config.percent };
  }

  @Patch()
  updateConfig(@Body() dto: UpdateDiscountConfigDto) {
    this.config.update(dto);
    return { n: this.config.n, percent: this.config.percent };
  }
}
