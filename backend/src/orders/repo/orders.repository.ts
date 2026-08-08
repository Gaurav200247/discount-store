import { Injectable } from "@nestjs/common";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrdersRepository {
  private readonly orders: Order[] = [];

  save(order: Order): Order {
    this.orders.push(order);
    return order;
  }

  findAll(): Order[] {
    return [...this.orders];
  }
}
