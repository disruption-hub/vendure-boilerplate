import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

export enum VenueType {
  SITE = 'SITE',
  UNIT = 'UNIT',
  VIRTUAL = 'VIRTUAL',
}

export enum NetworkType {
  COMPLEX = 'COMPLEX',
  NETWORK = 'NETWORK',
  FEDERATION = 'FEDERATION',
}

export enum BookingMode {
  CAPACITY = 'CAPACITY',
  SLOT = 'SLOT',
  ENTIRE = 'ENTIRE',
  HYBRID = 'HYBRID',
}

export enum SlotType {
  MAT = 'MAT',
  BED = 'BED',
  DESK = 'DESK',
  SEAT = 'SEAT',
  OTHER = 'OTHER',
}

export enum BookingType {
  GENERAL = 'GENERAL',
  SLOT_SPECIFIC = 'SLOT_SPECIFIC',
  ENTIRE_SPACE = 'ENTIRE_SPACE',
}

export enum AccessMethod {
  IN_PERSON = 'IN_PERSON',
  VIRTUAL = 'VIRTUAL',
}

registerEnumType(VenueType, { name: 'VenueType' });
registerEnumType(NetworkType, { name: 'NetworkType' });
registerEnumType(BookingMode, { name: 'BookingMode' });
registerEnumType(SlotType, { name: 'SlotType' });
registerEnumType(BookingType, { name: 'BookingType' });
registerEnumType(AccessMethod, { name: 'AccessMethod' });

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class ServiceCategory {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [Service], { nullable: true })
  services?: Service[];
}

@ObjectType()
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  durationMinutes: number;

  @Field({ nullable: true })
  defaultPrice?: number;

  @Field(() => ServiceCategory, { nullable: true })
  category?: ServiceCategory;

  @Field(() => [Session], { nullable: true })
  sessions?: Session[];
}

@ObjectType()
export class BookingProfile {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metrics?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  uiConfig?: any;
}

@ObjectType()
export class SpacePreset {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string;

  @Field(() => Int)
  capacity: number;

  @Field(() => GraphQLJSON, { nullable: true })
  amenities?: any;
}

@ObjectType()
export class Venue {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true, defaultValue: 'UTC' })
  timezone?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  openingHours?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  amenities?: any;

  @Field(() => [Space])
  spaces: Space[];

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => Venue, { nullable: true })
  parent?: Venue;

  @Field(() => [Venue], { nullable: true })
  children?: Venue[];

  @Field(() => [VenueNetwork], { nullable: true })
  networks?: VenueNetwork[];

  @Field(() => VenueType)
  type: VenueType;

  @Field({ nullable: true })
  profileId?: string;

  @Field(() => BookingProfile, { nullable: true })
  profile?: BookingProfile;
}

@ObjectType()
export class Space {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ defaultValue: 'room' })
  type: string;

  @Field(() => Venue)
  venue: Venue;

  @Field(() => Int, { nullable: true })
  capacity?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  amenities?: any;

  @Field(() => BookingMode)
  activeBookingMode: BookingMode;

  @Field(() => Int)
  totalSlots: number;

  @Field({ nullable: true })
  basePrice?: number;

  @Field({ nullable: true })
  slotPrice?: number;

  @Field({ nullable: true })
  entireSpacePrice?: number;

  @Field(() => [SpaceSlot], { nullable: true })
  slots?: SpaceSlot[];
}

@ObjectType()
export class SpaceSlot {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  spaceId: string;

  @Field(() => Space)
  space: Space;

  @Field()
  slotIdentifier: string;

  @Field(() => SlotType)
  slotType: SlotType;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  attributes?: any;

  @Field()
  pricingModifier: number;

  @Field()
  isPremium: boolean;
}

@ObjectType()
export class VenueNetwork {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => NetworkType)
  type: NetworkType;

  @Field(() => [Venue], { nullable: true })
  venues?: Venue[];
}

@ObjectType()
export class PassTemplate {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string; // 'PACK' | 'MEMBERSHIP'

  @Field(() => Int, { nullable: true })
  creditsAmount?: number;

  @Field()
  unlimited: boolean;

  @Field(() => Int, { nullable: true })
  validDurationDays?: number;

  @Field(() => [Venue], { nullable: true })
  validForVenues?: Venue[];

  @Field(() => [VenueNetwork], { nullable: true })
  validForNetworks?: VenueNetwork[];
}

@ObjectType()
export class Pass {
  @Field(() => ID)
  id: string;

  @Field(() => PassTemplate)
  template: PassTemplate;

  @Field()
  status: string; // 'ACTIVE' | 'EXPIRED' | 'REVOKED'

  @Field(() => Int, { nullable: true })
  creditsRemaining?: number;

  @Field({ nullable: true })
  expiryDate?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class Session {
  @Field(() => ID)
  id: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field(() => Service)
  service: Service;

  @Field(() => Space, { nullable: true })
  space?: Space;

  @Field(() => BookingMode)
  bookingMode: BookingMode;

  @Field(() => Int)
  maxCapacity: number;

  @Field(() => Int, { nullable: true })
  availableCapacity?: number;

  @Field(() => Int)
  totalSlots: number;

  @Field(() => Int)
  availableSlots: number;

  @Field({ nullable: true })
  basePrice?: number;

  @Field({ nullable: true })
  slotPrice?: number;

  @Field()
  allowEntireSpaceBooking: boolean;

  @Field()
  entireSpaceBooked: boolean;

  @Field({ nullable: true })
  entireSpacePrice?: number;

  @Field({ nullable: true })
  virtualPlatform?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  virtualAccessDetails?: any;

  @Field(() => [Booking])
  bookings: Booking[];
}

@ObjectType()
export class Booking {
  @Field(() => ID)
  id: string;

  @Field()
  status: string; // 'CONFIRMED' | 'CANCELLED' etc

  @Field(() => BookingType)
  bookingType: BookingType;

  @Field({ nullable: true })
  bookableSlotId?: string;

  @Field(() => SpaceSlot, { nullable: true })
  slot?: SpaceSlot;

  @Field(() => Int)
  quantity: number;

  @Field({ nullable: true })
  priceCharged?: number;

  @Field(() => AccessMethod)
  accessMethod: AccessMethod;

  @Field(() => GraphQLJSON, { nullable: true })
  virtualAccessInfo?: any;

  @Field(() => Session)
  session: Session;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ServiceProvider {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String], { nullable: true })
  specialties?: string[];

  @Field(() => [Service], { nullable: true })
  services?: Service[];

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => BookingProfile, { nullable: true })
  profile?: BookingProfile;

  @Field(() => [Venue], { nullable: true })
  qualifiedVenues?: Venue[];

  @Field(() => [Space], { nullable: true })
  qualifiedSpaces?: Space[];
}
