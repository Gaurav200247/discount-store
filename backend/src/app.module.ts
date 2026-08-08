import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CartModule } from "./cart/cart.module";
import { RequestLoggingMiddleware } from "./common/middleware/request-logging.middleware";
import { ConfigModule } from "./config/config.module";
import { CouponsModule } from "./coupons/coupons.module";
import { OrdersModule } from "./orders/orders.module";
import { ProductsModule } from "./products/products.module";
import { StatsModule } from "./stats/stats.module";

@Module({
  imports: [
    ConfigModule,
    ProductsModule,
    CartModule,
    CouponsModule,
    OrdersModule,
    StatsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
