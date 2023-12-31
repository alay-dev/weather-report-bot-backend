import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import TelegramBot = require('node-telegram-bot-api');
import { createCanvas, loadImage } from 'canvas';
import { format } from 'date-fns';

type WeatherData = {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main:
      | 'Thunderstorm'
      | 'Mist'
      | 'Drizzle'
      | 'Rain'
      | 'Snow'
      | 'Clear'
      | 'Clouds'
      | 'Smoke'
      | 'Haze'
      | 'Dust'
      | 'Fog'
      | 'Sand'
      | 'Ash'
      | 'Squall'
      | 'Tornado';
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
};

const messages = new Map<string, any>();
const users = new Map<string, any>();
const banedUser = new Map<string, any>();
const forecast = new Map<string, any>();

@Injectable()
export class TelegramService {
  private bot;
  private chatId;
  private token;

  private weatherApikey = '0efeba1e4c191235ff83bc4199348682';

  constructor() {
    this.token = process.env.BOT_TOKEN || '';
    this.bot = new TelegramBot(this.token, { polling: true });
    this.chatId = process.env.CHANNEL_ID || '';

    this.bot.on('message', (msg) => {
      this.updateStates(msg);

      this.bot.sendMessage(
        msg.chat.id,
        `Please join to ${process.env.CHANNEL_LINK}`,
      );
    });
  }

  async fetchWeatherData(): Promise<WeatherData> {
    const data = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=13.0827&lon=80.2707&appid=${this.weatherApikey}&units=metric`,
    ).then((res) => res.json());
    return data;
  }

  async generateImage(data: WeatherData) {
    const icon = data.weather.at(0)?.icon;
    const temp = Math.round(data.main.temp);
    const weatherType = data.weather.at(0)?.main || '';
    const date = format(new Date(), 'do, MMM y');

    let tagline = '';

    if (weatherType === 'Thunderstorm')
      tagline = 'Thunder Roars, Nature Applause!';
    else if (
      weatherType === 'Mist' ||
      weatherType === 'Fog' ||
      weatherType === 'Haze'
    )
      tagline = 'Lost in the Fog, Find Your Inner Peace.';
    else if (weatherType === 'Snow')
      tagline = 'Snowflakes Falling, Blanket of Silence!';
    else if (weatherType === 'Rain')
      tagline = 'Raindrops Keep Falling, Spirits Keep Rising!';
    else if (weatherType === 'Clear')
      tagline = 'Sunshine All the Way, Enjoy the Rays Today!';
    else if (weatherType === 'Drizzle')
      tagline = "A Blend of Sun and Clouds, Nature's Art Show!";

    const imageUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4527A0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = await loadImage(imageUrl);
    ctx.drawImage(img, 10, 10, 90, 90);
    ctx.font = '16px Roboto';
    ctx.fillStyle = '#fff';
    ctx.fillText(weatherType, 40, 100);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Roboto';
    ctx.fillText(date, 280, 30);

    ctx.font = 'bold 40px Roboto';
    ctx.fillText(temp?.toString(), 250, 90);
    ctx.font = '14px Roboto';
    ctx.fillText('° c', 294, 74);

    ctx.font = '13px Roboto';
    ctx.fillText(
      `${data.main.temp_max}° c / ${data.main.temp_min}° c`,
      230,
      110,
    );

    ctx.font = '15px Roboto';
    ctx.fillText(tagline, 20, 160);

    const buffer = canvas.toBuffer('image/png');
    return buffer;
  }

  async generateMessage(data: WeatherData) {
    const temp = Math.round(data.main.temp);
    const weatherType = data.weather.at(0)?.main || '';
    const date = format(new Date(), 'do, MMM y');

    let tagline = '';

    if (weatherType === 'Thunderstorm')
      tagline = 'Thunder Roars, Nature Applause!';
    else if (
      weatherType === 'Mist' ||
      weatherType === 'Fog' ||
      weatherType === 'Haze'
    )
      tagline = 'Lost in the Fog, Find Your Inner Peace.';
    else if (weatherType === 'Snow')
      tagline = 'Snowflakes Falling, Blanket of Silence!';
    else if (weatherType === 'Rain')
      tagline = 'Raindrops Keep Falling, Spirits Keep Rising!';
    else if (weatherType === 'Clear')
      tagline = 'Sunshine All the Way, Enjoy the Rays Today!';
    else if (weatherType === 'Drizzle')
      tagline = "A Blend of Sun and Clouds, Nature's Art Show!";

    const message = `Weather update for ${date} \n 
    Temp : ${temp}° c
    ${data.main.temp_max}° c / ${data.main.temp_min}° c \n
    ${tagline}
    `;

    return message;
  }

  async sendMessage() {
    const weatherData = await this.fetchWeatherData();
    // const message = await this.generateMessage(weatherData);
    const imageBuffer = await this.generateImage(weatherData);

    const date = format(new Date(), 'do, MMM y');
    forecast.set(date, {
      date: new Date(),
      icon: weatherData?.weather?.at(0)?.icon,
      main: weatherData.weather.at(0)?.main,
      tempMax: weatherData?.main?.temp_max,
      tempMin: weatherData?.main?.temp_min,
    });

    // await this.bot.sendMessage(this.chatId, message);
    await this.bot.sendPhoto(this.chatId, imageBuffer);
  }

  async getUser(userId: number) {
    const data = await this.bot.getChatMember(this.chatId, userId);
    return { data: data };
  }

  async updateStates(msg: TelegramBot.Message) {
    messages.set(msg.message_id?.toString(), {
      id: msg.message_id?.toString(),
      text: msg.text,
    });

    users.set(msg?.from?.id?.toString() || `unknown_${uuidv4()}`, {
      id: msg?.from?.id?.toString() || `unknown_${uuidv4()}`,
      name: msg.from?.first_name || 'unknown user',
    });
  }

  async updateBot(token: string, chatId: string) {
    console.log('Update bot');
    if (token === this.token && chatId === this.chatId) {
      throw new BadRequestException('Bot already configured to this.');
    }
    let chatData: TelegramBot.Chat;

    // try {
    //   chatData = await this.bot.getChat(chatId);
    // } catch (err) {
    //   console.log(err.response.body.description, chatId);
    //   if (err.response.body.description === 'Bad Request: chat not found') {
    //     throw new BadRequestException('Invalid Channel ID');
    //   }
    // }

    if (this.chatId !== chatId) {
      messages.clear();
      // this.users.clear();
      // this.banedUser.clear();
      forecast.clear();
    }
    this.token = token;
    this.chatId = chatId;

    try {
      await this.bot.removeAllListeners();
      await this.bot.stopPolling();
      const _bot = new TelegramBot(token, { polling: true });

      this.bot = _bot;
    } catch (err) {
      console.log(err.response.body);
      throw new BadRequestException(err.response.body.description);
    }

    this.bot.on('message', (msg) => {
      this.updateStates(msg);

      this.bot.sendMessage(
        msg.chat.id,
        `Please join to ${chatData?.invite_link}`,
      );
    });
    console.log(chatId);
    this.chatId = chatId;

    return { message: 'Successfully updated bot settings' };
  }

  async getBotDetail() {
    try {
      const data = await this.bot.getMe();
      const channel = await this.bot.getChat(this.chatId);
      return {
        data: {
          bot: { ...data, token: this.token },
          channel: channel,
        },
        error: null,
        success: true,
      };
    } catch (err) {
      throw new BadRequestException(err.response?.body.description);
    }
  }

  async getChatMemberCount() {
    try {
      const data = await this.bot.getChatMemberCount(this.chatId);
      return {
        data: data,
      };
    } catch (err) {
      return err;
    }
  }

  async getAllMessages() {
    return {
      data: Array.from(messages.values()),
    };
  }

  async getAllUsers() {
    return {
      data: Array.from(users.values()),
    };
  }

  async getAllForcasts() {
    return {
      data: Array.from(forecast.values()),
    };
  }

  async getBannedUsers() {
    return {
      data: Array.from(banedUser.values()),
    };
  }

  async banUser(userId: number) {
    try {
      await this.bot.banChatMember(this.chatId, userId);
      const user = users.get(userId?.toString());
      users.delete(userId?.toString());
      banedUser.set(userId?.toString(), user);

      return {
        message: 'User banned',
        success: true,
      };
    } catch (err) {
      throw new BadRequestException("Can't remove chat owner");
    }
  }

  async unBanUser(userId: number) {
    await this.bot.unbanChatMember(this.chatId, userId);
    const user = banedUser.get(userId?.toString());
    banedUser.delete(userId?.toString());
    users.set(userId?.toString(), user);

    return {
      message: 'User unbanned',
    };
  }

  async hardReset() {
    await this.bot.removeAllListeners();
    await this.bot.stopPolling();
    this.token = process.env.BOT_TOKEN || '';
    this.chatId = process.env.CHANNEL_ID || '';

    this.bot = new TelegramBot(this.token, { polling: true });

    // this.bot
    this.bot.on('message', (msg) => {
      this.updateStates(msg);

      this.bot.sendMessage(
        msg.chat.id,
        `Please join to ${process.env.CHANNEL_LINK}`,
      );
    });

    return {
      message: 'Reset successful',
    };
  }
}
