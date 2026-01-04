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
    validDurationDays?: number;
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
export interface DayHours {
    open?: string;
    close?: string;
    closed: boolean;
}

export interface OpeningHours {
    mon?: DayHours;
    tue?: DayHours;
    wed?: DayHours;
    thu?: DayHours;
    fri?: DayHours;
    sat?: DayHours;
    sun?: DayHours;
}

export interface SpacePreset {
    id: string;
    name: string;
    type: string;
    capacity: number;
    amenities?: any;
}

export interface BookingProfile {
    id: string;
    name: string;
    slug: string;
    description?: string;
    metrics?: any;
    uiConfig?: any;
}

export interface VenueNetwork {
    id: string;
    name: string;
    description?: string;
    type: 'COMPLEX' | 'NETWORK' | 'FEDERATION';
}


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

    async getAllVenues(): Promise<any[]> {
        const query = gql`
            query GetAllVenues {
                allVenues {
                    id
                    name
                    address
                    description
                    timezone
                    type
                    openingHours
                    spaces { id name capacity }
                    networks { id name type }
                    parent { id name }
                    children { id name }
                    profile { id name }
                }
            }
        `;
        const data = await this.getClient().request<{ allVenues: any[] }>(query);
        return data.allVenues;
    }

    async createVenue(token: string, input: {
        name: string;
        type: 'SITE' | 'UNIT' | 'VIRTUAL';
        address?: string;
        description?: string;
        timezone?: string;
        openingHours?: OpeningHours;
        amenities?: any;
        profileId?: string;
        parentId?: string;
        networkIds?: string[];
    }) {
        const mutation = gql`
            mutation CreateVenue(
            $type: VenueType!,
            $name: String!,
            $address: String,
            $description: String,
            $timezone: String,
            $openingHours: OpeningHoursInput,
            $amenities: JSONObject,
            $profileId: String,
            $parentId: String,
            $networkIds: [String!]
        ) {
            createVenue(
                type: $type,
                name: $name,
                address: $address,
                description: $description,
                timezone: $timezone,
                openingHours: $openingHours,
                amenities: $amenities,
                profileId: $profileId,
                parentId: $parentId,
                networkIds: $networkIds
            ) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateVenue(token: string, input: {
        id: string;
        name?: string;
        type?: 'SITE' | 'UNIT' | 'VIRTUAL';
        address?: string;
        description?: string;
        timezone?: string;
        openingHours?: OpeningHours;
        amenities?: any;
        profileId?: string;
        parentId?: string;
        networkIds?: string[];
    }) {
        const mutation = gql`
            mutation UpdateVenue(
            $id: String!,
            $name: String,
            $type: VenueType,
            $address: String,
            $description: String,
            $timezone: String,
            $openingHours: OpeningHoursInput,
            $amenities: JSONObject,
            $profileId: String,
            $parentId: String,
            $networkIds: [String!]
        ) {
            updateVenue(
                id: $id,
                name: $name,
                type: $type,
                address: $address,
                description: $description,
                timezone: $timezone,
                openingHours: $openingHours,
                amenities: $amenities,
                profileId: $profileId,
                parentId: $parentId,
                networkIds: $networkIds
            ) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async createSpace(token: string, input: {
        venueId: string;
        name: string;
        capacity?: number;
        type?: string;
        amenities?: any;
    }) {
        const mutation = gql`
            mutation CreateSpace($venueId: String!, $name: String!, $capacity: Int, $type: String, $amenities: JSONObject) {
            createSpace(venueId: $venueId, name: $name, capacity: $capacity, type: $type, amenities: $amenities) {
                id
                name
                capacity
                type
                amenities
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateSpace(token: string, input: {
        id: string;
        name?: string;
        capacity?: number;
        type?: string;
        amenities?: any;
    }) {
        const mutation = gql`
            mutation UpdateSpace($id: String!, $name: String, $capacity: Int, $type: String, $amenities: JSONObject) {
                updateSpace(id: $id, name: $name, capacity: $capacity, type: $type, amenities: $amenities) {
                    id
                    name
                    capacity
                    type
                    amenities
                }
            }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async deleteSpace(token: string, id: string) {
        const mutation = gql`
            mutation DeleteSpace($id: String!) {
                deleteSpace(id: $id)
            }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    async getAllSpacePresets(token: string): Promise<SpacePreset[]> {
        const query = gql`
            query AllSpacePresets {
                allSpacePresets {
                id
                name
                type
                capacity
                amenities
            }
        }
        `;
        const data = await this.getClient(token).request<{ allSpacePresets: SpacePreset[] }>(query);
        return data.allSpacePresets;
    }

    async createSpacePreset(token: string, input: {
        name: string;
        type: string;
        capacity: number;
        amenities?: any;
    }) {
        const mutation = gql`
            mutation CreateSpacePreset($name: String!, $type: String!, $capacity: Int!, $amenities: JSONObject) {
            createSpacePreset(name: $name, type: $type, capacity: $capacity, amenities: $amenities) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async deleteSpacePreset(token: string, id: string) {
        const mutation = gql`
            mutation DeleteSpacePreset($id: String!) {
            deleteSpacePreset(id: $id)
        }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    async deleteVenue(token: string, id: string) {
        const mutation = gql`
            mutation DeleteVenue($id: String!) {
            deleteVenue(id: $id)
        }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    async getAllServices(): Promise<any[]> {
        const query = gql`
            query GetAllServices {
                allServices {
                id
                name
            }
        }
        `;
        const data = await this.getClient().request<{ allServices: any[] }>(query);
        return data.allServices;
    }

    async createService(token: string, input: { name: string; description?: string; duration?: number; price?: number }) {
        const mutation = gql`
            mutation CreateService($name: String!, $description: String, $duration: Float, $price: Float) {
            createService(name: $name, description: $description, duration: $duration, price: $price) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateService(token: string, input: { id: string; name?: string; description?: string; duration?: number; price?: number }) {
        const mutation = gql`
            mutation UpdateService($id: String!, $name: String, $description: String, $duration: Float, $price: Float) {
                updateService(id: $id, name: $name, description: $description, duration: $duration, price: $price) {
                    id
                    name
                }
            }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async deleteService(token: string, id: string) {
        const mutation = gql`
            mutation DeleteService($id: String!) {
                deleteService(id: $id)
            }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    async getAllPassTemplates(): Promise<PassTemplate[]> {
        const query = gql`
            query GetAllPassTemplates {
                allPassTemplates {
                id
                name
                type
                creditsAmount
                unlimited
            }
        }
        `;
        const data = await this.getClient().request<{ allPassTemplates: PassTemplate[] }>(query);
        return data.allPassTemplates;
    }

    async createPassTemplate(token: string, input: {
        name: string;
        type: string;
        creditsAmount?: number;
        unlimited?: boolean;
        validDurationDays?: number;
    }) {
        const mutation = gql`
            mutation CreatePassTemplate(
            $name: String!,
            $type: String!,
            $creditsAmount: Int,
            $unlimited: Boolean,
            $validDurationDays: Int
        ) {
            createPassTemplate(
                name: $name,
                type: $type,
                creditsAmount: $creditsAmount,
                unlimited: $unlimited,
                validDurationDays: $validDurationDays
            ) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updatePassTemplate(token: string, input: {
        id: string;
        name?: string;
        type?: string;
        creditsAmount?: number;
        unlimited?: boolean;
        validDurationDays?: number;
    }) {
        const mutation = gql`
            mutation UpdatePassTemplate(
            $id: String!,
            $name: String,
            $type: String,
            $creditsAmount: Int,
            $unlimited: Boolean,
            $validDurationDays: Int
        ) {
            updatePassTemplate(
                id: $id,
                name: $name,
                type: $type,
                creditsAmount: $creditsAmount,
                unlimited: $unlimited,
                validDurationDays: $validDurationDays
            ) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async deletePassTemplate(token: string, id: string) {
        const mutation = gql`
            mutation DeletePassTemplate($id: String!) {
            deletePassTemplate(id: $id)
        }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    async getAllSessions(): Promise<any[]> {
        const query = gql`
            query GetAllSessions {
                allSessions {
                    id
                    startTime
                    endTime
                    maxCapacity
                    service { id name }
                    space { id name venue { name } }
                    bookings { id }
                }
            }
        `;
        const data = await this.getClient().request<{ allSessions: any[] }>(query);
        return data.allSessions;
    }

    async createSession(token: string, input: {
        serviceId: string;
        startTime: string;
        endTime: string;
        maxCapacity: number;
        spaceId?: string;
    }) {
        const mutation = gql`
            mutation CreateSession(
            $serviceId: String!,
            $startTime: DateTime!,
            $endTime: DateTime!,
            $maxCapacity: Int!,
            $spaceId: String
        ) {
            createSession(
                serviceId: $serviceId,
                startTime: $startTime,
                endTime: $endTime,
                maxCapacity: $maxCapacity,
                spaceId: $spaceId
            ) {
                id
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateSession(token: string, input: {
        id: string;
        serviceId?: string;
        startTime?: string;
        endTime?: string;
        maxCapacity?: number;
        spaceId?: string;
    }) {
        const mutation = gql`
            mutation UpdateSession(
            $id: String!,
            $serviceId: String,
            $startTime: DateTime,
            $endTime: DateTime,
            $maxCapacity: Int,
            $spaceId: String
        ) {
            updateSession(
                id: $id,
                serviceId: $serviceId,
                startTime: $startTime,
                endTime: $endTime,
                maxCapacity: $maxCapacity,
                spaceId: $spaceId
            ) {
                id
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async deleteSession(token: string, id: string) {
        const mutation = gql`
            mutation DeleteSession($id: String!) {
            deleteSession(id: $id)
        }
        `;
        return this.getClient(token).request(mutation, { id });
    }

    // Booking Profile Methods
    async getAllBookingProfiles(token: string): Promise<BookingProfile[]> {
        const query = gql`
            query AllBookingProfiles {
                allBookingProfiles {
                id
                name
                slug
                description
                metrics
                uiConfig
            }
        }
        `;
        const data = await this.getClient(token).request<{ allBookingProfiles: BookingProfile[] }>(query);
        return data.allBookingProfiles;
    }

    async createBookingProfile(token: string, input: {
        name: string;
        slug: string;
        description?: string;
        metrics?: any;
        uiConfig?: any;
    }) {
        const mutation = gql`
            mutation CreateBookingProfile($name: String!, $slug: String!, $description: String, $metrics: JSONObject, $uiConfig: JSONObject) {
            createBookingProfile(name: $name, slug: $slug, description: $description, metrics: $metrics, uiConfig: $uiConfig) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateBookingProfile(token: string, input: {
        id: string;
        name?: string;
        slug?: string;
        description?: string;
        metrics?: any;
        uiConfig?: any;
    }) {
        const mutation = gql`
            mutation UpdateBookingProfile($id: String!, $name: String, $slug: String, $description: String, $metrics: JSONObject, $uiConfig: JSONObject) {
            updateBookingProfile(id: $id, name: $name, slug: $slug, description: $description, metrics: $metrics, uiConfig: $uiConfig) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    // Venue Network Methods
    async getAllVenueNetworks(token: string): Promise<VenueNetwork[]> {
        const query = gql`
            query AllVenueNetworks {
                allVenueNetworks {
                id
                name
                type
                description
            }
        }
        `;
        const data = await this.getClient(token).request<{ allVenueNetworks: VenueNetwork[] }>(query);
        return data.allVenueNetworks;
    }

    async createVenueNetwork(token: string, input: {
        name: string;
        type: 'COMPLEX' | 'NETWORK' | 'FEDERATION';
        description?: string;
    }) {
        const mutation = gql`
            mutation CreateVenueNetwork($name: String!, $type: VenueType!, $description: String) {
            createVenueNetwork(name: $name, type: $type, description: $description) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }

    async updateVenueNetwork(token: string, input: {
        id: string;
        name?: string;
        type?: 'COMPLEX' | 'NETWORK' | 'FEDERATION';
        description?: string;
    }) {
        const mutation = gql`
            mutation UpdateVenueNetwork($id: String!, $name: String, $type: VenueType, $description: String) {
            updateVenueNetwork(id: $id, name: $name, type: $type, description: $description) {
                id
                name
            }
        }
        `;
        return this.getClient(token).request(mutation, input);
    }
}

export const bookingClient = new BookingClient();
