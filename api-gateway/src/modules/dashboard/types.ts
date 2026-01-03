export interface ZKeyUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    primaryEmail: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    phoneVerified: boolean;
    walletAddress?: string | null;
    avatar: string | null;
}

export interface VendureCustomer {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    orders: any[];
}

export interface UnifiedDashboardData {
    user: ZKeyUser;
    customer?: VendureCustomer;
}
