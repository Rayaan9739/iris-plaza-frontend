"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Fetching bookings...");
    const bookings = await prisma.booking.findMany({
        include: {
            room: true,
            user: true,
        },
    });
    console.log(`Found ${bookings.length} bookings.`);
    bookings.forEach((b) => {
        console.log(`Booking ID: "${b.id}" (Type: ${typeof b.id})`);
        console.log(`  Status: ${b.status}`);
        console.log(`  User: ${b.user.firstName} ${b.user.lastName} (${b.user.id})`);
        console.log(`  Room: ${b.room.name} (${b.room.id})`);
        console.log("-----------------------------------");
    });
    const cancellationRequests = await prisma.cancellationRequest.findMany();
    console.log(`Found ${cancellationRequests.length} cancellation requests.`);
    cancellationRequests.forEach((cr) => {
        console.log(`Request ID: ${cr.id}`);
        console.log(`  Booking ID: "${cr.bookingId}"`);
        console.log(`  Status: ${cr.status}`);
        console.log("-----------------------------------");
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check_data.js.map