import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { StatsService } from "./stats.service";

@ApiTags("admin")
@Controller("admin")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({ summary: "Get system statistics" })
  @Get("stats")
  getStats() {
    return this.statsService.getStats();
  }
}
