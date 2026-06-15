import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma';

/** URL segments that are never tenant identifiers */
const SKIP_PREFIXES = ['/health', '/assets/', '/favicon.ico', '/swagger', '/api/'];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const url = req.url; // e.g. /hungphat/api/products?page=1

    // 1. Skip system paths — let them pass through unchanged
    if (SKIP_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      next();
      return;
    }

    // 2. Parse URL segments (ignore leading slash)
    //    /hungphat/api/products  →  ['hungphat', 'api', 'products']
    const pathname = url.split('?')[0]; // strip query string
    const segments = pathname.replace(/^\//, '').split('/');

    // 3. Only handle /:tenant/api/... pattern
    if (segments.length < 2 || segments[1] !== 'api') {
      next();
      return;
    }

    const identifier = segments[0]; // 'hungphat' or 'abc1234'

    // 4. Resolve store: try SlugName first, then DisplayId
    //    Two separate queries to apply different expiry logic
    let matchedViaSlug = false;

    let store = await this.prisma.store.findUnique({
      where: { SlugName: identifier },
      select: {
        StoreID: true,
        StoreName: true,
        DisplayId: true,
        SlugName: true,
        SlugNameExpiredAt: true,
        Status: true,
      },
    });

    if (store) {
      matchedViaSlug = true;
    } else {
      store = await this.prisma.store.findUnique({
        where: { DisplayId: identifier },
        select: {
          StoreID: true,
          StoreName: true,
          DisplayId: true,
          SlugName: true,
          SlugNameExpiredAt: true,
          Status: true,
        },
      });
    }

    // 5. Store not found or inactive
    if (!store || store.Status !== 'Active') {
      throw new NotFoundException(`Store "${identifier}" not found`);
    }

    // 6. Slug matched but its subscription has expired → 403
    //    (store is still accessible via DisplayId URL)
    if (matchedViaSlug && store.SlugNameExpiredAt !== null) {
      if (new Date() > store.SlugNameExpiredAt) {
        throw new ForbiddenException(
          `The custom URL for this store has expired. Please use the permanent URL with ID "${store.DisplayId ?? ''}" instead.`,
        );
      }
    }

    // 7. Inject store ID into headers (overwrite any client-supplied value)
    req.headers['x-store-id'] = String(store.StoreID);

    // 8. Rewrite URL: /hungphat/api/products?page=1 → /products?page=1
    //    Remove the first two segments (/:tenant/api) and prepend /
    const rest = segments.slice(2).join('/'); // 'products'
    const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
    req.url = `/${rest}${query}`; // /products?page=1

    next();
  }
}
