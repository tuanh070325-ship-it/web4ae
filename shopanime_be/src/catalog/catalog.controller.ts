import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { AuthGuard, AdminGuard } from '../db/auth.guard.js';

@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalogService: CatalogService) {
    this.getProducts = this.getProducts.bind(this);
    this.getProduct = this.getProduct.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.getCategories = this.getCategories.bind(this);
    this.createCategory = this.createCategory.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.deleteCategory = this.deleteCategory.bind(this);
    this.getAuthors = this.getAuthors.bind(this);
    this.createAuthor = this.createAuthor.bind(this);
    this.updateAuthor = this.updateAuthor.bind(this);
    this.deleteAuthor = this.deleteAuthor.bind(this);
  }

  @Get('products')
  async getProducts(@Query() query: Record<string, string | string[] | undefined>) {
    return this.catalogService.getProducts(query);
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
