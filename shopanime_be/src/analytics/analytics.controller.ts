import { Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard, AuthGuard } from '../db/auth.guard.js';
import { bindControllerMethods } from '../common/bind-controller-methods.js';
import { AnalyticsService } from './analytics.service.js';
import type { AnalyticsEventInput } from './analytics.types.js';

@Controller()
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {
    bindControllerMethods(this, ['recordEvent', 'getSummary', 'getPages', 'getProducts', 'getFunnel']);
  }

  @Post('analytics/events')
  async recordEvent(@Body() body: AnalyticsEventInput, @Req() request: Request) {
    return { data: await this.analyticsService.recordEvent(body, request) };
  }

  @Get('admin/analytics/summary')
  @UseGuards(AuthGuard, AdminGuard)
  async getSummary(@Query() query: Record<string, string | string[] | undefined>) {
    return { data: await this.analyticsService.getSummary(query) };
  }

  @Get('admin/analytics/pages')
  @UseGuards(AuthGuard, AdminGuard)
  async getPages(@Query() query: Record<string, string | string[] | undefined>) {
    return { data: await this.analyticsService.getPages(query) };
  }

  @Get('admin/analytics/products')
  @UseGuards(AuthGuard, AdminGuard)
  async getProducts(@Query() query: Record<string, string | string[] | undefined>) {
    return { data: await this.analyticsService.getProducts(query) };
  }

  @Get('admin/analytics/funnel')
  @UseGuards(AuthGuard, AdminGuard)
  async getFunnel(@Query() query: Record<string, string | string[] | undefined>) {
    return { data: await this.analyticsService.getFunnel(query) };
  }
}
