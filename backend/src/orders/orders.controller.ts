import { Body, Controller, Get, Post } from "@nestjs/common";
import { CheckoutDto } from "./dto/checkout.dto";
import { OrdersService } from "./orders.service";

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("orders")
  listOrders() {
    return this.ordersService.findAll();
  }

  @Post("checkout")
  checkout(@Body() dto: CheckoutDto) {
    return this.ordersService.checkout(dto);
  }
}
