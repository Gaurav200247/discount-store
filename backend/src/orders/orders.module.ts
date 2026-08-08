import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { CouponsModule } from "../coupons/coupons.module";
import { ProductsModule } from "../products/products.module";
import { OrdersController } from "./orders.controller";
import { OrdersRepository } from "./repo/orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CartModule, CouponsModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersRepository],
})
export class OrdersModule {}
