# Quick Database Migration - Execute These Commands

Run in the `backend` directory:

```bash
npx prisma generate
npx prisma db push
```

---

## What These Commands Do

### `npx prisma generate`

- Regenerates the Prisma client based on updated schema
- Creates TypeScript types for new/modified models
- No database changes yet

### `npx prisma db push`

- Pushes schema changes to your PostgreSQL database
- Creates/modifies columns in tables
- May prompt for data migration if needed

---

## Expected Prompts During `db push`

You may see warnings about:

- Adding required column `tenantId` to main tenanceTicket table
- Removing column `userId` from maintenance_tickets table (or keeping it)
- Converting `rentAmount`, `paidAmount`, `pendingAmount` to NUMERIC (Decimal)

**Accept all changes** - they are required for the system to work.

---

## Verify After Migration

Backend should start without errors:

```bash
npm run start:dev
```

Check logs for:

- ✅ No Prisma schema validation errors
- ✅ No "Unknown argument" errors
- ✅ Services initialize successfully

---

## System Should Now Support

1. ✅ Tenant creates maintenance request → No errors
2. ✅ Admin approves money reduction → Rent is reduced
3. ✅ Payment tracking → Decimal precision
4. ✅ Next month rent → Includes pending carry-over
5. ✅ All database queries → Execute without schema mismatches
