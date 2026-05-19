import { Global, Module } from '@nestjs/common';
import { AdminGuard, AuthGuard } from './auth.guard.js';
import { DbService } from './db.service.js';

@Global()
@Module({
  providers: [DbService, AuthGuard, AdminGuard],
  exports: [DbService, AuthGuard, AdminGuard],
})
export class DbModule {}
