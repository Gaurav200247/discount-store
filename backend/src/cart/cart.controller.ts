import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddItemDto } from "./dto/add-item.dto";
import { SetQuantityDto } from "./dto/set-quantity.dto";

@ApiTags("cart")
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: "Add an item to a cart" })
  @Post("items")
  addItem(@Body() dto: AddItemDto) {
    return this.cartService.addItem(dto.cartId, dto.productId, dto.quantity);
  }

  @ApiOperation({ summary: "Remove an item from a cart" })
  @Delete(":id/items/:productId")
  removeItem(@Param("id") id: string, @Param("productId") productId: string) {
    return this.cartService.removeItem(id, productId);
  }

  @ApiOperation({ summary: "Update an item quantity in a cart" })
  @Patch(":id/items/:productId")
  setQuantity(
    @Param("id") id: string,
    @Param("productId") productId: string,
    @Body() dto: SetQuantityDto,
  ) {
    return this.cartService.setItemQuantity(id, productId, dto.quantity);
  }

  @ApiOperation({ summary: "Clear a cart" })
  @Delete(":id")
  clearCart(@Param("id") id: string) {
    this.cartService.clearCart(id);
  }

  @ApiOperation({ summary: "Get a cart by id" })
  @Get(":id")
  getCart(@Param("id") id: string) {
    return this.cartService.getCart(id);
  }
}
