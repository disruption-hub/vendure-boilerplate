import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        // Return all class types with their upcoming sessions
        return this.prisma.classType.findMany({
            include: {
                sessions: {
                    where: {
                        startTime: {
                            gte: new Date(),
                        },
                    },
                    orderBy: {
                        startTime: 'asc',
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.classType.findUnique({
            where: { id },
            include: {
                sessions: {
                    where: {
                        startTime: {
                            gte: new Date(),
                        },
                    },
                },
            },
        });
    }
}
