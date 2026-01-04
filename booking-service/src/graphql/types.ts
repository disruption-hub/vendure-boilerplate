import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class Space {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
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

  // Use this to return booking count for calculation
  // In a real scenario, we might resolve this field separately
  @Field(() => [Booking])
  bookings: Booking[];
}

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
