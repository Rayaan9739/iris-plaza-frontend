const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check room types in database
  const rooms = await prisma.room.findMany({
    select: { type: true },
    distinct: ['type']
  });
  console.log('Room types in DB:', rooms.map(r => r.type));
  
  // Check if there's bookingSource in Room table
  const roomColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'`;
  console.log('Room columns:', roomColumns);
  
  // Check bookingSource in Bookings table
  const bookingColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'`;
  console.log('Booking columns:', bookingColumns);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
