import {
  Body,
  Controller,
  Put,
  Get,
  Post,
  HttpCode,
  Param,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UpdateBotDto } from './dto/update-bot.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UnBanUserDto } from './dto/unban-user.dto';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get()
  getBotDetail() {
    return this.telegramService.getBotDetail();
  }

  @Get('get_messages')
  getAllMessages() {
    return this.telegramService.getAllMessages();
  }

  @Get('get_users')
  getAllUsers() {
    return this.telegramService.getAllUsers();
  }
  @Get('get_banned_users')
  getBanedUsers() {
    return this.telegramService.getBannedUsers();
  }

  @Get('get_forecasts')
  getAllForecasts() {
    return this.telegramService.getAllForcasts();
  }

  @Get('get_user/:id')
  getChatUser(@Param() params: { id: number }) {
    return this.telegramService.getUser(params?.id);
  }

  @Put()
  updateBot(@Body() updateBotDto: UpdateBotDto) {
    return this.telegramService.updateBot(
      updateBotDto.token,
      updateBotDto.chat_id,
    );
  }

  @Post('ban_user')
  @HttpCode(200)
  banUser(@Body() banUserDto: BanUserDto) {
    return this.telegramService.banUser(banUserDto.user_id);
  }

  @Post('unban_user')
  @HttpCode(200)
  unbanUser(@Body() unBanUserDto: UnBanUserDto) {
    return this.telegramService.unBanUser(unBanUserDto.user_id);
  }

  @Post('hard_reset')
  @HttpCode(200)
  hardReset() {
    return this.telegramService.hardReset();
  }
}
