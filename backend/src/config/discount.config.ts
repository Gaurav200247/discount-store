import { Inject, Injectable, Logger } from "@nestjs/common";

export interface DiscountConfig {
  n: number;
  percent: number;
}

export const ENV: unique symbol = Symbol("ENV");

const DEFAULT_N = 5;
const DEFAULT_PERCENT = 10;

function parsePositiveInt(
  value: string | undefined,
  name: string,
  defaultValue: number,
): number {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Invalid config: ${name} must be an integer (got "${value}").`,
    );
  }

  return parsed;
}

@Injectable()
export class DiscountConfigService {
  private readonly logger = new Logger(DiscountConfigService.name);

  n: number;
  percent: number;

  constructor(@Inject(ENV) env: NodeJS.ProcessEnv) {
    this.n = parsePositiveInt(env.DISCOUNT_N, "DISCOUNT_N", DEFAULT_N);
    this.assertValidN(this.n, env.DISCOUNT_N);

    this.percent = parsePositiveInt(
      env.DISCOUNT_PERCENT,
      "DISCOUNT_PERCENT",
      DEFAULT_PERCENT,
    );

    this.assertValidPercent(this.percent, env.DISCOUNT_PERCENT);

    this.logger.log(
      `Config loaded: DISCOUNT_N=${this.n}, DISCOUNT_PERCENT=${this.percent}%`,
    );
  }

  private assertValidN(n: number, source: string | undefined): void {
    if (n < 1) {
      throw new Error(
        `Invalid config: DISCOUNT_N must be >= 1 (got "${source}").`,
      );
    }
  }

  private assertValidPercent(
    percent: number,
    source: string | undefined,
  ): void {
    if (!(percent > 0 && percent < 100)) {
      throw new Error(
        `Invalid config: DISCOUNT_PERCENT must satisfy 0 < x < 100 (got "${source}").`,
      );
    }
  }

  /** Applies a partial runtime update to the discount rule. */
  update(partial: { n?: number; percent?: number }): void {
    if (partial.n !== undefined) {
      if (!Number.isInteger(partial.n)) {
        throw new Error("Invalid config: n must be an integer.");
      }

      this.assertValidN(partial.n, String(partial.n));
      this.n = partial.n;
    }

    if (partial.percent !== undefined) {
      if (!Number.isInteger(partial.percent)) {
        throw new Error("Invalid config: percent must be an integer.");
      }

      this.assertValidPercent(partial.percent, String(partial.percent));
      this.percent = partial.percent;
    }

    this.logger.log(
      `Config updated at runtime: DISCOUNT_N=${this.n}, DISCOUNT_PERCENT=${this.percent}%`,
    );
  }
}
