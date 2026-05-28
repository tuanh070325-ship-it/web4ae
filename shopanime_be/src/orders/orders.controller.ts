import { Controller, Get, Post, Put, Body, Param, UseGuards, ForbiddenException, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { OrdersService, type CheckoutInput } from './orders.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, AdminGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller('orders')
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {
    bindControllerMethods(this, [
      'getAllOrders',
      'getUserOrders',
      'getMyOrders',
      'getOrderDetails',
      'checkout',
      'updateOrderStatus',
    ]);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  async getAllOrders() {
    return { data: await this.ordersService.getAllOrders() };
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getUserOrders(@Param('userId') userId: string, @CurrentUser() user: RequestUser) {
    if (user.id !== parseInt(userId) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    return { data: await this.ordersService.getUserOrders(userId) };
  }

  @Get('me/list')
  @UseGuards(AuthGuard)
  async getMyOrders(@CurrentUser() user: RequestUser) {
    return { data: await this.ordersService.getUserOrders(String(user.id)) };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrderDetails(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const orderDetails = await this.ordersService.getOrderDetails(id);
    if (!orderDetails) {throw new NotFoundException('Order not found');}
    
    if (user.id !== Number(orderDetails.user_id) && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }

    return { data: orderDetails };
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  async checkout(@Body() body: CheckoutInput, @CurrentUser() user: RequestUser) {
    const userId = body.user_id ? Number(body.user_id) : user.id;
    if (user.id !== userId && user.role !== 'ADMIN') {
      throw new ForbiddenException('Forbidden');
    }
    
    if (!body.receiver_name || !body.receiver_phone) {
      throw new BadRequestException('Missing required fields');
    }

    const result = await this.ordersService.checkout({ ...body, user_id: userId });
    return { success: true, data: result, message: 'Order placed successfully' };
  }

  @Put(':id/status')
  @UseGuards(AuthGuard, AdminGuard)
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status?: unknown }) {
    await this.ordersService.updateOrderStatus(id, String(body.status || ''));
    return { success: true, message: 'Order status updated' };
  }
}
