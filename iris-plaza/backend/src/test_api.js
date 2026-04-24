const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'd:/manipal/backend/.env' });

const prisma = new PrismaClient();

async function testApis() {
  console.log('Testing API queries...\n');
  
  try {
    // Test 1: getAdminRooms
    console.log('1. Testing getAdminRooms (Room.findMany)...');
    const rooms = await prisma.room.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        floor: true,
        area: true,
        rent: true,
        deposit: true,
        status: true,
        isAvailable: true,
        occupiedFrom: true,
        occupiedUntil: true,
        videoUrl: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });
    console.log(`   ✓ Success: Found ${rooms.length} rooms`);
    
    // Test 2: getAdminBookings
    console.log('2. Testing getAdminBookings (Booking.findMany)...');
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        room: { 
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            floor: true,
            area: true,
            rent: true,
            deposit: true,
            status: true,
            isAvailable: true,
            occupiedFrom: true,
            occupiedUntil: true,
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          }
        },
        documents: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`   ✓ Success: Found ${bookings.length} bookings`);
    
    // Test 3: getAdminPayments
    console.log('3. Testing getAdminPayments (Payment.findMany)...');
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        bookingId: true,
        rentCycleId: true,
        amount: true,
        type: true,
        status: true,
        gateway: true,
        gatewayOrderId: true,
        gatewayPaymentId: true,
        gatewaySignature: true,
        description: true,
        invoiceUrl: true,
        createdAt: true,
        updatedAt: true,
        user: true,
        booking: { include: { room: { select: { id: true, name: true, type: true, rent: true } } } },
        rentCycle: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log(`   ✓ Success: Found ${payments.length} payments`);
    
    // Test 4: getAllTenants
    console.log('4. Testing getAllTenants...');
    const activeStatuses = ['APPROVED', 'APPROVED_PENDING_PAYMENT'];
    const tenants = await prisma.booking.findMany({
      where: { status: { in: activeStatuses } },
      include: { user: true, room: { 
        select: {
          id: true,
          name: true,
          type: true,
          floor: true,
          rent: true,
          deposit: true,
          status: true,
          isAvailable: true,
        }
      } },
      orderBy: { createdAt: "desc" },
    });
    console.log(`   ✓ Success: Found ${tenants.length} active tenants`);
    
    console.log('\n✓ All API tests passed!');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testApis();
