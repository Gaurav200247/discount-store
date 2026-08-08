import { Injectable, Logger } from "@nestjs/common";
import { InsufficientStockException } from "../common/exceptions/insufficient-stock.exception";
import { ProductNotFoundException } from "../common/exceptions/product-not-found.exception";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product } from "./entities/product.entity";

const SEED_PRODUCTS: Product[] = [
  new Product("phone", "Phone", 49999, 12),
  new Product("laptop", "Laptop", 129999, 5),
  new Product("headphones", "Headphones", 14999, 20),
  new Product("mouse", "Mouse", 2999, 40),
  new Product("keyboard", "Keyboard", 5999, 8),
];

/** Converts a name into a URL-safe slug used as the product id. */
function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "product"
  );
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private readonly products: Map<string, Product> = new Map(
    SEED_PRODUCTS.map((p) => [p.id, p]),
  );

  constructor() {
    const catalog = [...this.products.values()]
      .map((p) => `${p.name}=${p.priceCents}c`)
      .join(", ");
    this.logger.log(
      `Seeded catalog (${this.products.size} products): ${catalog}`,
    );
  }

  findAll(): Product[] {
    return [...this.products.values()];
  }

  findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  findByIdOrThrow(id: string): Product {
    const product = this.findById(id);

    if (!product) {
      this.logger.warn(`Product not found: ${id}`);
      throw new ProductNotFoundException(id);
    }

    return product;
  }

  /** Throws unless at least `quantity` units of the product are in stock. */
  assertStockAvailable(id: string, quantity: number): Product {
    const product = this.findByIdOrThrow(id);
    if (product.stock < quantity) {
      this.logger.warn(
        `Insufficient stock for ${product.name}: requested ${quantity}, available ${product.stock}`,
      );
      throw new InsufficientStockException(
        product.name,
        quantity,
        product.stock,
      );
    }
    return product;
  }

  /** Decrements stock, enforcing that it never goes below zero. */
  decrementStock(id: string, quantity: number): Product {
    const product = this.assertStockAvailable(id, quantity);
    product.stock -= quantity;
    this.logger.log(
      `${product.name} stock: ${product.stock + quantity} -> ${product.stock}`,
    );
    return product;
  }

  /** Creates a new product with a slug id derived from its name. */
  create(dto: CreateProductDto): Product {
    let id = slugify(dto.name);

    let suffix = 2;

    while (this.products.has(id)) {
      id = `${slugify(dto.name)}-${suffix}`;
      suffix += 1;
    }

    const product = new Product(id, dto.name.trim(), dto.priceCents, dto.stock);

    this.products.set(id, product);

    this.logger.log(
      `Product created: ${id} (${dto.name}, ${dto.priceCents}c, stock ${dto.stock})`,
    );

    return product;
  }

  /** Partially updates an existing product (name, price and/or stock). */
  update(id: string, dto: UpdateProductDto): Product {
    const existing = this.findByIdOrThrow(id);

    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const priceCents = dto.priceCents ?? existing.priceCents;
    const stock = dto.stock ?? existing.stock;

    const product = new Product(existing.id, name, priceCents, stock);

    this.products.set(product.id, product);

    this.logger.log(
      `Product updated: ${product.id} (${name}, ${priceCents}c, stock ${stock})`,
    );

    return product;
  }
}
