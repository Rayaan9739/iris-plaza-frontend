import { PrismaClient, RoomType, RoomStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("10-10-2006", 12);

  // Check if admin exists and update, or create new
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  let admin;
  if (existingAdmin) {
    // Update existing admin with DOB using raw query
    await prisma.$executeRaw`
      UPDATE users 
      SET phone = ${'+919845151899'}, password = ${hashedPassword}, dob = ${new Date('2006-10-10')}
      WHERE id = ${existingAdmin.id}
    `;
    admin = await prisma.user.findUnique({ where: { id: existingAdmin.id } });
    console.log(`✅ Admin updated: ${admin?.email}`);
    console.log(`   Phone: ${admin?.phone}`);
    console.log(`   Password: 10-10-2006`);
    console.log(`   DOB: 10-10-2006`);
  } else {
    admin = await prisma.user.upsert({
      where: { email: "admin@manipal.com" },
      update: {
        phone: "+919845151899",
        password: hashedPassword,
      },
      create: {
        phone: "+919845151899",
        email: "admin@manipal.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        isApproved: true,
        accountStatus: "ACTIVE",
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`✅ Admin created/updated: ${admin.email}`);
    console.log(`   Phone: ${admin.phone}`);
    console.log(`   Password: 10-10-2006`);
  }

  console.log(`✅ Admin created/updated: ${admin.email}`);
  console.log(`   Phone: ${admin.phone}`);
  console.log(`   Password: 10-10-2006`);

  // Create some sample rooms with numbered names
  const rooms = [
    {
      name: "101",
      type: "ONE_BHK" as RoomType,
      rent: 8000,
      deposit: 16000,
      area: 200,
      floor: 1,
      status: "AVAILABLE" as RoomStatus,
      description: "Single room on floor 1",
    },
    {
      name: "102",
      type: "ONE_BHK" as RoomType,
      rent: 8000,
      deposit: 16000,
      area: 200,
      floor: 1,
      status: "AVAILABLE" as RoomStatus,
      description: "Single room on floor 1",
    },
    {
      name: "103",
      type: "ONE_BHK" as RoomType,
      rent: 10000,
      deposit: 20000,
      area: 250,
      floor: 1,
      status: "AVAILABLE" as RoomStatus,
      description: "Premium single room on floor 1",
    },
    {
      name: "201",
      type: "ONE_BHK" as RoomType,
      rent: 12000,
      deposit: 24000,
      area: 300,
      floor: 2,
      status: "AVAILABLE" as RoomStatus,
      description: "Double occupancy room on floor 2",
    },
    {
      name: "202",
      type: "ONE_BHK" as RoomType,
      rent: 12000,
      deposit: 24000,
      area: 300,
      floor: 2,
      status: "AVAILABLE" as RoomStatus,
      description: "Double occupancy room on floor 2",
    },
    {
      name: "203",
      type: "ONE_BHK" as RoomType,
      rent: 15000,
      deposit: 30000,
      area: 350,
      floor: 2,
      status: "AVAILABLE" as RoomStatus,
      description: "Premium double room on floor 2",
    },
    {
      name: "301",
      type: "TWO_BHK" as RoomType,
      rent: 18000,
      deposit: 36000,
      area: 500,
      floor: 3,
      status: "AVAILABLE" as RoomStatus,
      description: "Two bedroom apartment on floor 3",
    },
    {
      name: "302",
      type: "TWO_BHK" as RoomType,
      rent: 20000,
      deposit: 40000,
      area: 550,
      floor: 3,
      status: "AVAILABLE" as RoomStatus,
      description: "Premium two bedroom on floor 3",
    },
  ];

  for (const roomData of rooms) {
    const room = await prisma.room.create({
      data: roomData,
    });
    console.log(`✅ Created room: ${room.name}`);
  }

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Admin Login Credentials:");
  console.log("   Phone: +919845151899 (or 9845151899)");
  console.log("   Password: 10-10-2006");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
