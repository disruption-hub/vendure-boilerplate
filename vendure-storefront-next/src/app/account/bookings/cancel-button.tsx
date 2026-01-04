'use client';

import { Button } from "@/components/ui/button";
import { cancelBookingAction } from "@/app/dashboard/actions";
import { useTransition } from "react";
import { toast } from "sonner";

export function CancelButton({ bookingId }: { bookingId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        startTransition(async () => {
            try {
                await cancelBookingAction(bookingId);
                toast.success("Booking cancelled successfully.");
            } catch (error) {
                toast.error("Failed to cancel booking.");
                console.error(error);
            }
        });
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
        >
            {isPending ? "Cancelling..." : "Cancel"}
        </Button>
    );
}
