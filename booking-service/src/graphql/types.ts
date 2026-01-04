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

registerEnumType(VenueType, { name: 'VenueType' });
registerEnumType(NetworkType, { name: 'NetworkType' });

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
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
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

  @Field(() => Int)
  maxCapacity: number;

  @Field(() => [Booking])
  bookings: Booking[];
}

@ObjectType()
export class Booking {
  @Field(() => ID)
  id: string;

  @Field()
  status: string; // 'CONFIRMED' | 'CANCELLED' etc

  @Field(() => Session)
  session: Session;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  createdAt: Date;
}
