# NestJS Backend Structure

## Overview

This document describes the structure and organization of the NestJS backend application in the Evoque CMS monorepo.

## Directory Structure

```
apps/api/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller (health check)
│   ├── app.service.ts             # Root service
│   │
│   ├── prisma/                    # Prisma integration
│   │   ├── prisma.module.ts      # Prisma module (global)
│   │   └── prisma.service.ts     # Prisma service (extends PrismaClient)
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # Login, logout, me endpoints
│   │   ├── auth.service.ts       # Auth business logic
│   │   └── jwt.strategy.ts       # JWT passport strategy
│   │
│   ├── common/                    # Shared utilities
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # JwtAuthGuard, AdminGuard
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts  # @CurrentUser(), @CurrentUserId()
│   │   ├── filters/              # Exception filters (future)
│   │   └── interceptors/        # Response interceptors (future)
│   │
│   └── modules/                   # Feature modules
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── users.repository.ts
│       ├── roles/
│       │   ├── roles.module.ts
│       │   ├── roles.controller.ts
│       │   ├── roles.service.ts
│       │   └── roles.repository.ts
│       ├── permissions/
│       │   ├── permissions.module.ts
│       │   ├── permissions.controller.ts
│       │   ├── permissions.service.ts
│       │   └── permissions.repository.ts
│       ├── pages/                 # (To be migrated)
│       ├── forms/                 # (To be migrated)
│       ├── media/                 # (To be migrated)
│       └── ...                    # Other modules
│
├── test/                          # Test files
├── dist/                          # Compiled output
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Module Architecture

### Module Pattern

Each feature module follows NestJS best practices:

```
[resource]/
├── [resource].module.ts      # Module definition
├── [resource].controller.ts # HTTP endpoints (thin layer)
├── [resource].service.ts     # Business logic
└── [resource].repository.ts # Data access layer
```

### Layer Responsibilities

#### Controller Layer
- **Purpose:** Handle HTTP requests/responses
- **Responsibilities:**
  - Route definitions (`@Get()`, `@Post()`, etc.)
  - Request validation (via DTOs)
  - Authentication/authorization (via guards)
  - Response formatting
- **Should NOT:**
  - Contain business logic
  - Directly access database
  - Handle complex transformations

**Example:**
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Get()
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }
  
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

#### Service Layer
- **Purpose:** Business logic and orchestration
- **Responsibilities:**
  - Business rule validation
  - Data transformation
  - Error handling
  - Calling repository methods
  - Cross-module coordination
- **Should NOT:**
  - Handle HTTP concerns
  - Directly access Prisma (use repository)

**Example:**
```typescript
@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}
  
  async create(createUserDto: CreateUserDto) {
    // Business logic
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    
    // Transform data
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    
    // Delegate to repository
    return this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }
}
```

#### Repository Layer
- **Purpose:** Data access abstraction
- **Responsibilities:**
  - Database queries (Prisma)
  - Query building
  - Data fetching
  - Simple data transformations
- **Should NOT:**
  - Contain business logic
  - Handle HTTP concerns
  - Make business decisions

**Example:**
```typescript
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}
  
  async findMany(query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
    });
  }
}
```

## Core Components

### PrismaModule

**Location:** `src/prisma/prisma.module.ts`

**Purpose:** Provides PrismaService globally to all modules

**Configuration:**
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Usage:**
```typescript
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}
  // PrismaService extends PrismaClient
}
```

### AuthModule

**Location:** `src/auth/auth.module.ts`

**Components:**
- `AuthController`: Login, logout, get current user
- `AuthService`: Authentication business logic
- `JwtStrategy`: Passport JWT strategy
- `JwtModule`: JWT configuration

**Endpoints:**
- `POST /api/v1/auth/login` - Authenticate user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Guards

**Location:** `src/common/guards/auth.guard.ts`

#### JwtAuthGuard
- Validates JWT token
- Attaches user to request object
- Used on protected routes

#### AdminGuard
- Requires admin role
- Must be used with JwtAuthGuard
- Used on admin-only routes

**Usage:**
```typescript
@UseGuards(JwtAuthGuard)                    // Any authenticated user
@UseGuards(JwtAuthGuard, AdminGuard)        // Admin only
```

### Decorators

**Location:** `src/common/decorators/current-user.decorator.ts`

#### @CurrentUser()
Extracts authenticated user from request

```typescript
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user;
}
```

#### @CurrentUserId()
Extracts user ID from request

```typescript
@Get('my-resources')
getMyResources(@CurrentUserId() userId: string) {
  return this.service.findByUserId(userId);
}
```

## Configuration

### Environment Variables

**File:** `.env` or `.env.local`

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/evoque

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://evoque-six.vercel.app
```

### Application Configuration

**File:** `src/main.ts`

- Global prefix: `/api/v1`
- CORS configuration
- Validation pipes
- Swagger documentation

**File:** `src/app.module.ts`

- Imports all feature modules
- Configures global modules (ConfigModule, PrismaModule)

## API Structure

### Endpoint Patterns

All endpoints follow RESTful conventions:

```
GET    /api/v1/[resource]           # List resources
GET    /api/v1/[resource]/:id       # Get single resource
POST   /api/v1/[resource]           # Create resource
PATCH  /api/v1/[resource]/:id       # Update resource
DELETE /api/v1/[resource]/:id       # Delete resource
```

### Nested Resources

```
GET    /api/v1/[resource]/:id/[nested]      # List nested resources
POST   /api/v1/[resource]/:id/[nested]     # Create nested resource
DELETE /api/v1/[resource]/:id/[nested]/:nestedId  # Delete nested resource
```

### Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## DTOs and Validation

### Using Shared DTOs

DTOs are imported from `@evoque/types`:

```typescript
import { CreateUserDto, UpdateUserDto } from '@evoque/types';

@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.service.create(createUserDto);
}
```

### Validation

Validation is handled automatically by `ValidationPipe`:

```typescript
// In main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

## Testing Structure

```
test/
├── unit/                    # Unit tests
│   ├── services/
│   └── repositories/
├── integration/             # Integration tests
│   └── modules/
└── e2e/                    # End-to-end tests
    └── *.e2e-spec.ts
```

## Best Practices

### 1. Dependency Injection
Always use constructor injection:

```typescript
@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private prisma: PrismaService,
  ) {}
}
```

### 2. Error Handling
Use NestJS built-in exceptions:

```typescript
throw new NotFoundException('User not found');
throw new ConflictException('User already exists');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Authentication required');
```

### 3. Async/Await
Always use async/await, never Promises directly:

```typescript
// ✅ Good
async findAll() {
  const users = await this.repository.findMany();
  return users;
}

// ❌ Bad
findAll() {
  return this.repository.findMany().then(users => users);
}
```

### 4. Type Safety
Use TypeScript types and DTOs:

```typescript
// ✅ Good
async create(dto: CreateUserDto): Promise<UserResponse> {
  // ...
}

// ❌ Bad
async create(dto: any): Promise<any> {
  // ...
}
```

### 5. Module Organization
Keep modules focused and cohesive:

- One module per domain/feature
- Related functionality grouped together
- Clear boundaries between modules

## Development Workflow

### Running the API

```bash
# Development (watch mode)
npm run dev:api

# Production
npm run build:api
npm run start:api
```

### Adding a New Module

1. Create module directory: `src/modules/[resource]/`
2. Create files:
   - `[resource].module.ts`
   - `[resource].controller.ts`
   - `[resource].service.ts`
   - `[resource].repository.ts`
3. Register module in `app.module.ts`
4. Add routes to controller
5. Implement business logic in service
6. Implement data access in repository

### Database Migrations

```bash
# Create migration
cd packages/prisma
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Documentation

### Swagger/OpenAPI

Automatically generated at `/api/docs` when running in development.

**Access:** `http://localhost:4000/api/docs`

**Configuration:** `src/main.ts`

```typescript
const config = new DocumentBuilder()
  .setTitle('Evoque CMS API')
  .setDescription('The Evoque CMS API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

## Performance Considerations

### Database Queries
- Use `select` to limit fields returned
- Implement pagination for list endpoints
- Use `include` judiciously (avoid N+1 queries)
- Add database indexes for frequently queried fields

### Caching
- Consider Redis for session storage
- Cache frequently accessed data
- Use HTTP cache headers

### Optimization
- Use connection pooling (Prisma handles this)
- Implement request rate limiting
- Monitor query performance
- Use database query logging in development

## Security

### Authentication
- JWT tokens with expiration
- Session validation in database
- Secure password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Permission checks at service level
- Guard-based route protection

### Input Validation
- DTO validation via class-validator
- SQL injection prevention (Prisma handles this)
- XSS prevention (input sanitization)

## Deployment

### Environment Setup
1. Set environment variables
2. Run database migrations
3. Generate Prisma client
4. Build application
5. Start server

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS origins configured
- [ ] JWT secret is secure
- [ ] Logging configured
- [ ] Error tracking (Sentry) configured
- [ ] Health check endpoint working
- [ ] Rate limiting configured

