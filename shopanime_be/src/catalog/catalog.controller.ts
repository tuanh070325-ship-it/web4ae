import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { AuthGuard, AdminGuard } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalogService: CatalogService) {
    bindControllerMethods(this, [
      'getProducts',
      'getAdminProducts',
      'getProduct',
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'getCategories',
      'createCategory',
      'updateCategory',
      'deleteCategory',
      'getAuthors',
      'createAuthor',
      'updateAuthor',
      'deleteAuthor',
    ]);
  }

  @Get('products')
  async getProducts(@Query() query: Record<string, string | string[] | undefined>) {
    return this.catalogService.getProducts(query);
  }


  @Get('admin/products')
  @UseGuards(AuthGuard, AdminGuard)
  async getAdminProducts(@Query() query: Record<string, string | string[] | undefined>) {
    return this.catalogService.getProducts(query, { includeInactive: true });
  }
  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    return { data: await this.catalogService.getProduct(slug) };
  }

  @Post('products')
  @UseGuards(AuthGuard, AdminGuard)
  async createProduct(@Body() body: any) {
    const newId = await this.catalogService.createProduct(body);
    return { data: { id: newId }, message: 'Product created' };
  }

  @Put('products/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    await this.catalogService.updateProduct(id, body);
    return { message: 'Product updated successfully' };
  }

  @Delete('products/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteProduct(@Param('id') id: string) {
    await this.catalogService.deleteProduct(id);
    return { success: true, message: 'Product deleted' };
  }

  @Get('categories')
  async getCategories() {
    return { data: await this.catalogService.getCategories() };
  }

  @Post('categories')
  @UseGuards(AuthGuard, AdminGuard)
  async createCategory(@Body() body: any) {
    const newId = await this.catalogService.createCategory(body);
    return { data: { id: newId }, message: 'Category created' };
  }

  @Put('categories/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    await this.catalogService.updateCategory(id, body);
    return { message: 'Category updated successfully' };
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteCategory(@Param('id') id: string) {
    await this.catalogService.deleteCategory(id);
    return { success: true, message: 'Category deleted' };
  }

  @Get('authors')
  async getAuthors() {
    return { data: await this.catalogService.getAuthors() };
  }

  @Post('authors')
  @UseGuards(AuthGuard, AdminGuard)
  async createAuthor(@Body() body: any) {
    const newId = await this.catalogService.createAuthor(body);
    return { data: { id: newId }, message: 'Author created' };
  }

  @Put('authors/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async updateAuthor(@Param('id') id: string, @Body() body: any) {
    await this.catalogService.updateAuthor(id, body);
    return { message: 'Author updated successfully' };
  }

  @Delete('authors/:id')
  @UseGuards(AuthGuard, AdminGuard)
  async deleteAuthor(@Param('id') id: string) {
    await this.catalogService.deleteAuthor(id);
    return { success: true, message: 'Author deleted' };
  }
}
