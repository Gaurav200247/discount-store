import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckoutDto } from "./dto/checkout.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: "List all orders" })
  @Get("orders")
  listOrders() {
    return this.ordersService.findAll();
  }

  @ApiOperation({ summary: "Checkout a cart (optionally with a coupon)" })
  @Post("checkout")
  checkout(@Body() dto: CheckoutDto) {
    return this.ordersService.checkout(dto);
  }
}
