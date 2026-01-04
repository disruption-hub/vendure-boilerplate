# System Architecture

This diagram describes the system architecture of the MatMax project, as implemented in the codebase.

## High-Level Workflow

```mermaid
graph TD
    subgraph Client ["Client / Browser"]
        User(["User / Customer"])
    end

    subgraph Vercel ["Vercel (Frontend Hosting)"]
        SF["vendure-storefront-next (Next.js)"]
        DB["zkey-dashboard (React/Next.js)"]
    end

    subgraph Railway ["Railway (Backend Services)"]
        AG["api-gateway (NestJS)"]
        
        VB["vendure-backend (Vendure Core)"]
        ZS["zkey-service (ZKey Auth/User Mgmt)"]
        BS["booking-service (Session/Orders)"]
        
        RV[("Postgres-bZGW (Vendure DB)")]
        RF[("postgres-ff (ZKey DB)")]
        RB[("Postgres-booking (Booking DB)")]
    end

    subgraph External ["External Integrations"]
        ST["Stripe (Payments)"]
        SG["SendGrid (Emails)"]
    end

    User --> SF
    User --> DB

    SF -- "Shop/Auth API" --> AG
    DB -- "Admin/Auth API" --> AG

    AG -- "/shop-api, /admin-api" --> VB
    AG -- "/auth, /users" --> ZS
    AG -- "/classes, /bookings, /graphql" --> BS

    VB -- "Persistence" --> RV
    ZS -- "Persistence" --> RF
    BS -- "Persistence" --> RB

    VB -- "Process Payments" --> ST
    VB -- "Send Transactional Mail" --> SG

    style RV fill:#f9f,stroke:#333,stroke-width:2px
    style RF fill:#ccf,stroke:#333,stroke-width:2px
    style RB fill:#cfc,stroke:#333,stroke-width:2px
    style Vercel fill:#f0f0f0,stroke:#666
    style Railway fill:#e1f5fe,stroke:#01579b
```

## Architectural Highlights
- **Service Isolation**: Each core domain (`Vendure`, `Zkey`, `Booking`) has its own dedicated microservice and independent PostgreSQL database to ensure data integrity and scalability.
- **Unified Gateway**: `api-gateway` (Port 3006) acts as the **sole entry point** for all system interactions. It unifies the Vendure Shop/Admin APIs, ZKey Auth, and Booking Service GraphQL via a single domain.
- **Microservices Communication**: Services are containerized and deployed on Railway, utilizing internal networking for low-latency communication.
