import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateMissingAgreementDocuments() {
  console.log('Finding approved bookings without agreement documents...');

  // Find all approved bookings
  const approvedBookings = await prisma.booking.findMany({
    where: {
      status: 'APPROVED',
    },
    include: {
      user: true,
      room: true,
      agreement: true,
      documents: {
        where: {
          type: 'AGREEMENT',
        },
      },
    },
  });

  console.log(`Found ${approvedBookings.length} approved bookings`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const booking of approvedBookings) {
    // Check if agreement document already exists
    const existingDoc = booking.documents.find(d => d.type === 'AGREEMENT');
    
    // Check if agreement record exists with URL
    const agreement = booking.agreement;

    if (existingDoc) {
      console.log(`Booking ${booking.id}: Agreement document already exists`);
      skipped++;
      continue;
    }

    if (!agreement?.agreementUrl) {
      console.log(`Booking ${booking.id}: No agreement URL found, skipping`);
      skipped++;
      continue;
    }

    // Extract filename from agreement URL
    const fileUrl = agreement.agreementUrl;
    const fileName = fileUrl.split('/').pop() || 'agreement.docx';

    try {
      await prisma.document.create({
        data: {
          id: `agreement-${booking.id}`,
          userId: booking.userId,
          bookingId: booking.id,
          name: 'Rental Agreement',
          type: 'AGREEMENT',
          fileUrl: fileUrl,
          fileName: fileName,
          status: 'APPROVED',
        },
      });
      console.log(`Booking ${booking.id}: Created agreement document`);
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Document already exists (race condition), try to update
        try {
          await prisma.document.update({
            where: { id: `agreement-${booking.id}` },
            data: {
              fileUrl: fileUrl,
              fileName: fileName,
              status: 'APPROVED',
            },
          });
          console.log(`Booking ${booking.id}: Updated agreement document`);
          updated++;
        } catch (updateError) {
          console.error(`Booking ${booking.id}: Failed to update document:`, updateError);
        }
      } else {
        console.error(`Booking ${booking.id}: Failed to create document:`, error.message);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${approvedBookings.length}`);

  await prisma.$disconnect();
}

generateMissingAgreementDocuments()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
