import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getZKeyAuthToken } from "@/lib/auth";
import { bookingClient } from "@/lib/booking-client";

export default async function AdminDashboard() {
    const token = await getZKeyAuthToken();
    if (!token) {
        return <div>Please log in (Admin) to view dashboard.</div>;
    }

    const bookings = await bookingClient.getAllBookings(token).catch(e => {
        console.error(e);
        return [];
    });

    const totalBookings = bookings.length;
    const activeUsers = new Set(bookings.map(b => b.user?.firstName || 'Unknown')).size;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Booking Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Session</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.user?.firstName || 'Unknown'}</TableCell>
                                    <TableCell>{booking.session.service.name}</TableCell>
                                    <TableCell>{new Date(booking.session.startTime).toLocaleString()}</TableCell>
                                    <TableCell>{booking.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
