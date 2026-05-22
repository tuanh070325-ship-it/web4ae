import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { CommunityService } from './community.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller()
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly communityService: CommunityService) {
    bindControllerMethods(this, ['getPosts', 'createPost', 'likePost', 'getProductReviews', 'createReview']);
  }

  @Get('posts')
  async getPosts() {
    return { data: await this.communityService.getPosts() };
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  async createPost(@Body() body: any, @CurrentUser() user: RequestUser) {
    const userId = body.user_id ? Number(body.user_id) : user.id;
    if (user.id !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    if(!body.content) {throw new BadRequestException('Missing content');}
    
    const newId = await this.communityService.createPost(String(userId), body.content);
    return { success: true, data: { id: newId }, message: 'Post created' };
  }

  @Post('posts/:id/like')
  @UseGuards(AuthGuard)
  async likePost(@Param('id') id: string) {
    await this.communityService.likePost(id);
    return { success: true, message: 'Post liked' };
  }

  @Get('reviews/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    return { data: await this.communityService.getProductReviews(productId) };
  }

  @Post('reviews')
  @UseGuards(AuthGuard)
  async createReview(@Body() body: any, @CurrentUser() user: RequestUser) {
    const userId = body.user_id ? Number(body.user_id) : user.id;
    if (user.id !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    
    const newId = await this.communityService.createReview({ ...body, user_id: userId });
    return { success: true, data: { id: newId }, message: 'Review added' };
  }
}
