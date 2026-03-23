declare module "stripe" {
  namespace Stripe {
    type Event = unknown;
    type PaymentIntent = unknown;
    type Account = unknown;
    namespace Checkout {
      type Session = unknown;
      type SessionCreateParams = unknown;
      namespace SessionCreateParams {
        type LineItem = unknown;
      }
    }
    type PaymentIntentCreateParams = unknown;
  }

  class Stripe {
    constructor(apiKey: string, config?: Record<string, unknown>);
    [key: string]: unknown;
  }

  export default Stripe;
}

declare module "@vercel/blob" {
  export function put(...args: unknown[]): Promise<unknown>;
  export function del(...args: unknown[]): Promise<unknown>;
}

declare module "@upstash/redis" {
  export class Redis {
    constructor(config: Record<string, unknown>);
    ping(...args: unknown[]): Promise<unknown>;
  }
}

declare module "@upstash/ratelimit" {
  export class Ratelimit {
    constructor(config: Record<string, unknown>);
    static slidingWindow(...args: unknown[]): unknown;
    limit(...args: unknown[]): Promise<unknown>;
  }
}
