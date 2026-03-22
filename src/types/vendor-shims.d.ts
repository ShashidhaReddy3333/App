declare module "stripe" {
  namespace Stripe {
    type Event = any;
    type PaymentIntent = any;
    type Account = any;
    namespace Checkout {
      type Session = any;
      type SessionCreateParams = any;
      namespace SessionCreateParams {
        type LineItem = any;
      }
    }
    type PaymentIntentCreateParams = any;
  }

  class Stripe {
    constructor(apiKey: string, config?: any);
    [key: string]: any;
  }

  export default Stripe;
}

declare module "@vercel/blob" {
  export function put(...args: any[]): Promise<any>;
  export function del(...args: any[]): Promise<any>;
}

declare module "@upstash/redis" {
  export class Redis {
    constructor(config: any);
    ping(...args: any[]): Promise<any>;
  }
}

declare module "@upstash/ratelimit" {
  export class Ratelimit {
    constructor(config: any);
    static slidingWindow(...args: any[]): any;
    limit(...args: any[]): Promise<any>;
  }
}
