import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [ScheduleModule.forRoot(), TelegramModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
