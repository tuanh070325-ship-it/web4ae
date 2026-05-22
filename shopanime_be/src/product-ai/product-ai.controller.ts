import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { AdminGuard, AuthGuard } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';
import type {
  ProductAiGenerateBody,
  ProductAiReviseBody} from './product-ai.service.js';
import {
  ProductAiService,
} from './product-ai.service.js';

@Controller('admin/product-ai')
@UseGuards(AuthGuard, AdminGuard)
export class ProductAiController {
  constructor(@Inject(ProductAiService) private readonly productAiService: ProductAiService) {
    bindControllerMethods(this, ['generateDescription', 'reviseDescription']);
  }

  @Post('description/generate')
  async generateDescription(@Body() body: ProductAiGenerateBody) {
    return { data: await this.productAiService.generateDescription(body) };
  }

  @Post('description/revise')
  async reviseDescription(@Body() body: ProductAiReviseBody) {
    return { data: await this.productAiService.reviseDescription(body) };
  }
}
