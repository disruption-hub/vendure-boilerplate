'use server';

import { getZKeyAuthToken } from "@/lib/auth";
import { bookingClient } from "@/lib/booking-client";
import { revalidatePath } from "next/cache";

export async function cancelBookingAction(bookingId: string) {
    const token = await getZKeyAuthToken();
    if (!token) {
        throw new Error("Unauthorized");
    }

    await bookingClient.cancelBooking(token, bookingId);
    revalidatePath('/account/bookings');
}
