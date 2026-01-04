import { GraphQLClient, gql } from 'graphql-request';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3006';
const GRAPHQL_ENDPOINT = `${API_GATEWAY_URL}/graphql`;

// Types (Mirroring Backend GraphQL Types)
export interface Booking {
    id: string;
    status: 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
    session: {
        startTime: string;
        endTime: string;
        service: {
            name: string;
        };
        space?: {
            name: string;
        };
    };
    user?: {
        firstName: string;
        lastName: string;
    };
}

export interface Session {
    id: string;
    startTime: string;
    endTime: string;
    bookings: Booking[];
    maxCapacity: number;
}

export interface PassTemplate {
    id: string;
    name: string;
    type: 'PACK' | 'MEMBERSHIP';
    creditsAmount?: number;
    unlimited: boolean;
}

export interface Pass {
    id: string;
    template: PassTemplate;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    creditsRemaining?: number;
    expiryDate?: string;
    createdAt: string;
}

// Client
export class BookingClient {
    private getClient(token?: string) {
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // ZKey Token
        }
        return new GraphQLClient(GRAPHQL_ENDPOINT, { headers });
    }

    // User Methods
    async getMyBookings(token: string): Promise<Booking[]> {
        const query = gql`
            query GetMyBookings {
                myBookings {
                    id
                    status
                    session {
                        startTime
                        endTime
                        service { name }
                        space { name }
                    }
                }
            }
        `;
        const data = await this.getClient(token).request<{ myBookings: Booking[] }>(query);
        return data.myBookings;
    }

    async getMyPasses(token: string): Promise<Pass[]> {
        const query = gql`
            query GetMyPasses {
                myPasses {
                    id
                    status
                    creditsRemaining
                    expiryDate
                    createdAt
                    template {
                        id
                        name
                        type
                        creditsAmount
                        unlimited
                    }
                }
            }
        `;
        const data = await this.getClient(token).request<{ myPasses: Pass[] }>(query);
        return data.myPasses;
    }

    async cancelBooking(token: string, bookingId: string) {
        const mutation = gql`
            mutation CancelBooking($id: String!) {
                cancelBooking(id: $id) {
                    id
                    status
                }
            }
        `;
        return this.getClient(token).request(mutation, { id: bookingId });
    }

    // Teacher Methods
    async getMyTeachingSessions(token: string): Promise<Session[]> {
        const query = gql`
            query GetMyTeachingSessions {
                myTeachingSessions {
                    id
                    startTime
                    maxCapacity
                    bookings {
                        id
                        session { service { name } } 
                    }
                }
            }
        `;
        // Note: The bookings inner query above is slightly recursive in type definition but okay for count
        const data = await this.getClient(token).request<{ myTeachingSessions: Session[] }>(query);
        return data.myTeachingSessions;
    }

    // Admin Methods
    async getAllBookings(token: string): Promise<Booking[]> {
        const query = gql`
            query GetAllBookings {
                allBookings {
                    id
                    status
                    user { firstName lastName }
                    session {
                        startTime
                        service { name }
                    }
                }
            }
        `;
        const data = await this.getClient(token).request<{ allBookings: Booking[] }>(query);
        return data.allBookings;
    }
}

export const bookingClient = new BookingClient();
