import type { CanActivate, ExecutionContext} from '@nestjs/common';
import { Injectable, UnauthorizedException, ForbiddenException, createParamDecorator, Inject } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DbService } from './db.service.js';
import { verifyAuthToken } from '../auth/token.js';

export interface RequestUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface RequestUserRow extends RowDataPacket, RequestUser {}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(DbService) private readonly dbService: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    const tokenPayload = token ? verifyAuthToken(token) : null;
    const allowDevUserHeader = process.env.NODE_ENV !== 'production';
    const userId = tokenPayload?.sub || (allowDevUserHeader ? request.headers['x-user-id'] : null);

    if (!userId) {
      throw new UnauthorizedException('Unauthorized: No user ID provided');
    }

    try {
      const user = await this.dbService.one<RequestUserRow>('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
      
      if (!user) {
        throw new UnauthorizedException('Unauthorized: Invalid user');
      }

      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Unauthorized: Verification failed');
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Unauthorized: Please authenticate first');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden: Admin access required');
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
