import {
    Controller,
    Get,
    Query,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CrmCustomer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    type: 'lead' | 'contact';
    status: string | null;
    createdAt: string;
}

@Controller('crm')
export class CrmCustomersController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('customers/search')
    async searchCustomers(
        @Query('phone') phone?: string,
        @Query('email') email?: string,
        @Query('tenantId') tenantId?: string,
        @Query('limit') limitStr?: string,
    ): Promise<CrmCustomer[]> {
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const customers: CrmCustomer[] = [];

        try {
            // Search ApplicationRequest (leads) by email or phone
            if (email || phone) {
                const where: any = {};

                if (email && phone) {
                    where.OR = [
                        { email: email.toLowerCase() },
                        { phone: phone },
                    ];
                } else if (email) {
                    where.email = email.toLowerCase();
                } else if (phone) {
                    where.phone = phone;
                }

                const leads = await this.prisma.applicationRequest.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                });

                customers.push(
                    ...leads.map((lead) => ({
                        id: lead.id,
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone !== 'not_provided' ? lead.phone : null,
                        type: 'lead' as const,
                        status: lead.status,
                        createdAt: lead.createdAt.toISOString(),
                    }))
                );
            }

            // Search ChatbotContact by phone
            if (phone && tenantId) {
                const contacts = await this.prisma.chatbotContact.findMany({
                    where: {
                        tenantId,
                        phone,
                        type: 'CONTACT',
                    },
                    include: {
                        members: {
                            include: {
                                phoneUser: {
                                    select: {
                                        email: true,
                                        phone: true,
                                        displayName: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                });

                contacts.forEach((contact) => {
                    const memberEmails = contact.members
                        .map((m) => m.phoneUser?.email)
                        .filter(Boolean) as string[];

                    customers.push({
                        id: contact.id,
                        name: contact.displayName,
                        email: memberEmails[0] || null,
                        phone: contact.phone,
                        type: 'contact' as const,
                        status: null,
                        createdAt: contact.createdAt.toISOString(),
                    });
                });
            }

            // Search ChatbotPhoneUser by phone or email
            if ((phone || email) && tenantId) {
                const where: any = { tenantId };
                if (phone) {
                    where.OR = [{ phone }, { normalizedPhone: phone }];
                }
                if (email) {
                    where.email = email.toLowerCase();
                }

                const phoneUsers = await this.prisma.chatbotPhoneUser.findMany({
                    where,
                    orderBy: { lastActiveAt: 'desc' },
                    take: limit,
                });

                phoneUsers.forEach((user) => {
                    // Only add if not already in customers list
                    const exists = customers.some(
                        (c) => c.email === user.email || c.phone === user.phone
                    );

                    if (!exists) {
                        customers.push({
                            id: user.id,
                            name: user.displayName || 'Cliente sin nombre',
                            email: user.email || null,
                            phone: user.phone,
                            type: 'contact' as const,
                            status: null,
                            createdAt: user.createdAt.toISOString(),
                        });
                    }
                });
            }
        } catch (error) {
            console.error('[CrmCustomersController] Error searching customers:', error);
            throw new HttpException(
                'Failed to search customers',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        // Remove duplicates by email/phone combination
        const uniqueCustomers = Array.from(
            new Map(
                customers.map((c) => [
                    `${c.email || ''}_${c.phone || ''}`,
                    c,
                ])
            ).values()
        );

        return uniqueCustomers.slice(0, limit);
    }

    @Get('customers/:id')
    async getCustomerById(
        @Query('id') id: string,
        @Query('type') type: 'lead' | 'contact',
    ): Promise<CrmCustomer> {
        if (!id || !type) {
            throw new HttpException(
                'Missing required parameters: id and type',
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            if (type === 'lead') {
                const lead = await this.prisma.applicationRequest.findUnique({
                    where: { id },
                });

                if (!lead) {
                    throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
                }

                return {
                    id: lead.id,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone !== 'not_provided' ? lead.phone : null,
                    type: 'lead',
                    status: lead.status,
                    createdAt: lead.createdAt.toISOString(),
                };
            } else {
                const contact = await this.prisma.chatbotContact.findUnique({
                    where: { id },
                    include: {
                        members: {
                            include: {
                                phoneUser: {
                                    select: {
                                        email: true,
                                        phone: true,
                                        displayName: true,
                                    },
                                },
                            },
                        },
                    },
                });

                if (!contact) {
                    throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
                }

                const memberEmails = contact.members
                    .map((m) => m.phoneUser?.email)
                    .filter(Boolean) as string[];

                return {
                    id: contact.id,
                    name: contact.displayName,
                    email: memberEmails[0] || null,
                    phone: contact.phone,
                    type: 'contact',
                    status: null,
                    createdAt: contact.createdAt.toISOString(),
                };
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('[CrmCustomersController] Error getting customer:', error);
            throw new HttpException(
                'Failed to get customer',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
