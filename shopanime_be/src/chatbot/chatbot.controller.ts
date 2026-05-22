import { Body, Controller, Inject, Post } from '@nestjs/common';
import { bindControllerMethods } from '../common/bind-controller-methods.js';
import type { ChatbotRequestBody } from './chatbot.service.js';
import { ChatbotService } from './chatbot.service.js';

@Controller('chatbot')
export class ChatbotController {
  constructor(@Inject(ChatbotService) private readonly chatbotService: ChatbotService) {
    bindControllerMethods(this, ['sendMessage']);
  }

  @Post('message')
  async sendMessage(@Body() body: ChatbotRequestBody) {
    return { data: await this.chatbotService.sendMessage(body) };
  }
}
