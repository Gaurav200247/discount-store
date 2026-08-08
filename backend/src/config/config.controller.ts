import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DiscountConfigService } from "./discount.config";
import { UpdateDiscountConfigDto } from "./dto/update-discount-config.dto";

@ApiTags("admin")
@Controller("admin/config")
export class ConfigController {
  constructor(private readonly config: DiscountConfigService) {}

  @ApiOperation({ summary: "Get the current discount configuration" })
  @Get()
  getConfig() {
    return { n: this.config.n, percent: this.config.percent };
  }

  @ApiOperation({ summary: "Update the discount configuration" })
  @Patch()
  updateConfig(@Body() dto: UpdateDiscountConfigDto) {
    this.config.update(dto);
    return { n: this.config.n, percent: this.config.percent };
  }
}
