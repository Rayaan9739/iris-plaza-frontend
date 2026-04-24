import { Controller, Post, Body } from '@nestjs/common';
import { ContactService, CreateContactMessageDto } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async createMessage(@Body() dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }
}
