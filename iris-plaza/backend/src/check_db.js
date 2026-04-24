const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'd:/manipal/backend/.env' });

const prisma = new PrismaClient();

async function main() {
  // Check room types in database
  const rooms = await prisma.room.findMany({
    select: { type: true },
    distinct: ['type']
  });
  console.log('Room types in DB:', JSON.stringify(rooms.map(r => r.type)));
  
  // Check room columns
  const roomColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'`;
  console.log('Room columns:', JSON.stringify(roomColumns));
  
  // Check booking columns
  const bookingColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'`;
  console.log('Booking columns:', JSON.stringify(bookingColumns));
  
  // Check all rooms
  const allRooms = await prisma.room.findMany({ take: 5 });
  console.log('Sample rooms:', JSON.stringify(allRooms, (key, value) => {
    if (value instanceof Uint8Array) return '[Buffer]';
    return value;
  }, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
