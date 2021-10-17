import { All, Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @see : https://docs.nestjs.com/controllers#routing
  @All('*')
  getHello2(@Req() request: any): string {
    return this.appService.getHello2();
  }
}
