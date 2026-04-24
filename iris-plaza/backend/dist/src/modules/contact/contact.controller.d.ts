import { ContactService, CreateContactMessageDto } from './contact.service';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    createMessage(dto: CreateContactMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
