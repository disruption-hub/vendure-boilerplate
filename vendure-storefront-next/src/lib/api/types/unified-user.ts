export interface UnifiedUserProfile {
    zkeyProfile: ZKeyUserProfile;
    vendureCustomer?: VendureCustomerProfile;
    // Future extensions
    loyaltyPoints?: number;
    bookings?: any[];
}

export interface ZKeyUserProfile {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    walletAddress?: string | null;
    avatar?: string | null;
    isVerified: boolean;
}

export interface VendureCustomerProfile {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    orders: any[]; // Define more specific order type if needed
}
