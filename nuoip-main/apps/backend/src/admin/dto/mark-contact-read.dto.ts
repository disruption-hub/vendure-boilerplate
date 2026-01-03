import { IsNotEmpty, IsString } from 'class-validator'

export class MarkContactAsReadDto {
    @IsString()
    @IsNotEmpty()
    contactId: string
}
