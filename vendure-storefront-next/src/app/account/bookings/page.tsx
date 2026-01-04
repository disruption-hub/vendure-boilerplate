import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getZKeyAuthToken } from "@/lib/auth";
import { bookingClient } from "@/lib/booking-client";
import { CancelButton } from "./cancel-button";

export default async function BookingsPage() {
    const token = await getZKeyAuthToken();
    if (!token) {
        return <div>Please log in to view your bookings.</div>;
    }

    const bookings = await bookingClient.getMyBookings(token).catch(e => {
        console.error(e);
        return [];
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">My Bookings</h2>
                <p className="text-muted-foreground">
                    View and manage your upcoming sessions.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'CONFIRMED').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Sessions</CardTitle>
                    <CardDescription>
                        Manage your upcoming classes and appointments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No bookings found</TableCell>
                                </TableRow>
                            ) : bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.session.service.name}</TableCell>
                                    <TableCell>{new Date(booking.session.startTime).toLocaleString()}</TableCell>
                                    <TableCell>{booking.session.space?.name || 'Online'}</TableCell>
                                    <TableCell>{booking.status}</TableCell>
                                    <TableCell className="text-right">
                                        {booking.status === 'CONFIRMED' && (
                                            <CancelButton bookingId={booking.id} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
