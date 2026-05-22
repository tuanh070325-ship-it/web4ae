import { Module } from '@nestjs/common';
import { ProductAiController } from './product-ai.controller.js';
import { ProductAiService } from './product-ai.service.js';

@Module({
  controllers: [ProductAiController],
  providers: [ProductAiService],
})
export class ProductAiModule {}
