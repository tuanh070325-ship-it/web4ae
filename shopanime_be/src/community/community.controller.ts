import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { CommunityService } from './community.service.js';
import type { RequestUser } from '../db/auth.guard.js';
import { AuthGuard, CurrentUser } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';

@Controller()
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly communityService: CommunityService) {
    bindControllerMethods(this, ['getPosts', 'createPost', 'likePost', 'createComment', 'updateComment', 'hideComment', 'deleteComment', 'getProductReviews', 'createReview']);
  }

  @Get('posts')
  async getPosts(@Req() request: any) {
    return { data: await this.communityService.getPosts(this.communityService.getOptionalUserId(request)) };
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
  async likePost(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return { success: true, data: await this.communityService.toggleLike(id, user.id) };
  }

  @Post('posts/:id/comments')
  @UseGuards(AuthGuard)
  async createComment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: RequestUser) {
    const newComment = await this.communityService.createComment(id, user.id, body);
    return { success: true, data: newComment, message: 'Comment created' };
  }

  @Put('posts/:postId/comments/:commentId')
  @UseGuards(AuthGuard)
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() body: any,
    @CurrentUser() user: RequestUser,
  ) {
    const updatedComment = await this.communityService.updateComment(postId, commentId, body, user);
    return { success: true, data: updatedComment, message: 'Comment updated' };
  }

  @Put('posts/:postId/comments/:commentId/hide')
  @UseGuards(AuthGuard)
  async hideComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const hiddenComment = await this.communityService.hideComment(postId, commentId, user);
    return { success: true, data: hiddenComment, message: 'Comment hidden' };
  }

  @Delete('posts/:postId/comments/:commentId')
  @UseGuards(AuthGuard)
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.communityService.deleteComment(postId, commentId, user);
    return { success: true, message: 'Comment deleted' };
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
