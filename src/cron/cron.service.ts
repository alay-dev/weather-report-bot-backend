import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class CronService implements OnModuleInit {
  constructor(private readonly telegramService: TelegramService) {}

  onModuleInit() {
    console.log('CronService has been initialized!');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async sendDailyMessage() {
    console.log('Sending daily message...');

    await this.telegramService.sendMessage();
  }
}
