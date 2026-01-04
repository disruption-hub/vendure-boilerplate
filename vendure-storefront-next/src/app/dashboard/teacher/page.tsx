import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getZKeyAuthToken } from "@/lib/auth";
import { bookingClient } from "@/lib/booking-client";

export default async function TeacherDashboard() {
    const token = await getZKeyAuthToken();
    if (!token) {
        return <div>Please log in to view your schedule.</div>;
    }

    const sessions = await bookingClient.getMyTeachingSessions(token).catch(e => {
        console.error(e);
        return [];
    });

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>

            <Card>
                <CardHeader>
                    <CardTitle>My Schedule</CardTitle>
                    <CardDescription>
                        Upcoming classes you are teaching.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class Name</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Attendees</TableHead>
                                <TableHead>Capacity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No classes scheduled</TableCell>
                                </TableRow>
                            ) : sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.bookings[0]?.session.service.name || 'Unknown Class'}</TableCell>
                                    <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                                    <TableCell>{session.bookings.length} / {session.maxCapacity}</TableCell>
                                    <TableCell>
                                        <div className="w-full bg-secondary h-2 rounded-full">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${(session.bookings.length / session.maxCapacity) * 100}%` }}
                                            />
                                        </div>
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
