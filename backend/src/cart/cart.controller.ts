import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddItemDto } from "./dto/add-item.dto";
import { SetQuantityDto } from "./dto/set-quantity.dto";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post("items")
  addItem(@Body() dto: AddItemDto) {
    return this.cartService.addItem(dto.cartId, dto.productId, dto.quantity);
  }

  @Delete(":id/items/:productId")
  removeItem(@Param("id") id: string, @Param("productId") productId: string) {
    return this.cartService.removeItem(id, productId);
  }

  @Patch(":id/items/:productId")
  setQuantity(
    @Param("id") id: string,
    @Param("productId") productId: string,
    @Body() dto: SetQuantityDto,
  ) {
    return this.cartService.setItemQuantity(id, productId, dto.quantity);
  }

  @Delete(":id")
  clearCart(@Param("id") id: string) {
    this.cartService.clearCart(id);
  }

  @Get(":id")
  getCart(@Param("id") id: string) {
    return this.cartService.getCart(id);
  }
}
