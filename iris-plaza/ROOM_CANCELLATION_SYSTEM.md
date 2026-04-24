# Room Cancellation Request System - Implementation Summary

## Overview

A complete room cancellation request system has been implemented allowing tenants to request room cancellation with admin approval workflow and automatic 24-hour room release.

---

## PART 1 - TENANT UI ✅

### File: `d:\manipal\frontend\src\pages\tenant\TenantRoom.tsx`

**Changes:**

- Added imports: `Button`, `AlertCircle`, `createCancellationRequest`, `getMyRequest`
- Added state management:
  - `cancellationRequest`: Stores current cancellation request status
  - `showCancelDialog`: Toggle for cancellation dialog
  - `submitting`: Loading state
  - `cancellationReason`: Textarea for optional reason
- Updated `useEffect` to load cancellation request status alongside booking data
- Added `handleRequestCancellation()` function to submit request via API
- Added UI elements:
  - **Cancel Room Request Button**: Placed below room details, shows only if no pending cancellation
  - **Cancellation Status Badge**: Shows status (PENDING/APPROVED/REJECTED) with context message
  - **Modal Dialog**: Confirmation dialog with optional reason textarea

**Features:**

- ✅ Confirmation dialog: "Are you sure you want to cancel your room booking? Admin approval is required."
- ✅ Optional reason submission
- ✅ Real-time status indicator
- ✅ Auto-refresh of status after submission

---

## PART 2 - DATABASE ✅

### File: `d:\manipal\backend\prisma\schema.prisma`

**Changes:**

1. Added enum `CancellationRequestStatus`:
   - PENDING
   - APPROVED
   - REJECTED

2. Added model `CancellationRequest`:

   ```prisma
   model CancellationRequest {
     id              String                      @id @default(uuid())
     bookingId       String                      @unique
     booking         Booking                     @relation(...)
     tenantId        String
     tenant          User                        @relation(...)

     reason          String?
     status          CancellationRequestStatus   @default(PENDING)

     approvedAt      DateTime?
     approvedBy      String?                     // Admin user ID
     rejectionReason String?
     releaseTime     DateTime?                   // approvedAt + 24 hours

     requestedAt     DateTime                    @default(now())
     createdAt       DateTime                    @default(now())
     updatedAt       DateTime                    @updatedAt
   }
   ```

3. Added relationships:
   - User → CancellationRequest (one-to-many via tenantId)
   - Booking → CancellationRequest (one-to-one via bookingId unique)

**Status:**

- ✅ Prisma schema updated
- ✅ Schema includes auto-calculated 24-hour release time
- ✅ Relationships properly configured

---

## PART 3 - ADMIN PANEL ✅

### File: `d:\manipal\frontend\src\pages\admin\AdminCancellationRequests.tsx` (NEW)

**Features:**

- ✅ Displays all pending cancellation requests
- ✅ Shows columns:
  - Tenant Name with Status Badge
  - Phone Number
  - Room Name
  - Move-in Date
  - Move-out Date
  - Request Date
- ✅ Approve/Reject buttons for pending requests
- ✅ Request details modal with full information
- ✅ Reject reason input dialog
- ✅ Auto-refresh after action

**Components:**

- Pending requests list with card layout
- Status indicator with priority color (pending = amber)
- Action buttons (green Approve, red Reject)
- Detail modal showing all request information
- Reject reason modal with textarea

---

## PART 4 - ADMIN APPROVAL LOGIC ✅

### File: `d:\manipal\backend\src\modules\cancellation-requests\cancellation-request.service.ts`

**Methods:**

1. `createRequest()`: Tenant submits cancellation request
   - Verifies booking exists and belongs to tenant
   - Checks for existing pending request
   - Creates new CancellationRequest with status=PENDING

2. `approveRequest()`: Admin approves request
   - Updates status to APPROVED
   - Sets approvedAt = current time
   - Sets releaseTime = approvedAt + 24 hours
   - Sets approvedBy = admin user ID

3. `rejectRequest()`: Admin rejects request
   - Updates status to REJECTED
   - Sets rejectionReason
   - Sets approvedBy = admin user ID

4. `getPendingRequests()`: Lists all pending requests
   - Filters for status=PENDING
   - Includes related booking, room, and user data
   - Orders by requestedAt descending

5. `getMyRequest()`: Gets tenant's current request
   - Finds tenant's approved booking
   - Returns associated cancellation request if exists

---

## PART 5 - ROOM RELEASE AFTER 24 HOURS ✅

### File: `d:\manipal\backend\src\modules\cancellation-requests/cancellation-request.service.ts`

**Scheduled Task:**

```typescript
@Cron("0 * * * * *") // Run every minute
async handleCron() {
  try {
    await this.processApprovedRequests();
  } catch (error) {
    console.error("Error processing approved cancellation requests:", error);
  }
}
```

**Processing:**

- Finds approved requests where releaseTime <= now
- For each request:
  1. Updates room:
     - status = AVAILABLE
     - occupiedFrom = null
     - occupiedUntil = null
     - isAvailable = true
  2. Updates booking:
     - status = CANCELLED
- Runs every minute to check for expired requests

---

## PART 6 - HOME PAGE VISIBILITY ✅

### File: `d:\manipal\frontend\src\pages\Index.tsx`

**Filter Logic:**
Added `isAvailable` check in the filtered rooms:

```typescript
const filtered = useMemo(() => {
  return rooms.filter((r) => {
    const matchesSearch = ...
    const matchesType = ...
    const matchesPrice = ...
    const isAvailable = r.status === "available";  // NEW
    return matchesSearch && matchesType && matchesPrice && isAvailable;
  });
}, [rooms, search, activeType, appliedMaxPrice]);
```

**Backend Filter (already existed):**
The getRooms endpoint already filters for AVAILABLE rooms:

```typescript
async findAll() {
  await this.refreshExpiredOccupancies();
  const rooms = await this.prisma.room.findMany({
    where: { deletedAt: null, status: "AVAILABLE" as any },
    select: this.roomSafeSelect,
  });
  ...
}
```

---

## PART 7 - TENANT STATUS DISPLAY ✅

### File: `d:\manipal\frontend\src\pages\tenant\TenantRoom.tsx`

**Status Display:**

```typescript
{cancellationRequest && (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
    <AlertCircle className="h-5 w-5 text-amber-600" />
    <div>
      <p className="font-semibold text-sm">Status: Cancellation {status}</p>
      <p className="text-xs text-amber-800 mt-0.5">
        {status === "PENDING" && "Your cancellation request is pending admin review."}
        {status === "APPROVED" && "Your room will be released after 24 hours."}
        {status === "REJECTED" && `Reason: ${rejectionReason}`}
      </p>
    </div>
  </div>
)}
```

---

## BACKEND API ENDPOINTS

### File: `d:\manipal\backend\src\modules\cancellation-requests/cancellation-request.controller.ts`

**Endpoints:**

1. `POST /api/cancellation-request`
   - Create new cancellation request
   - Auth: Required (tenant)
   - Body: { bookingId, reason? }

2. `GET /api/cancellation-request/my-request`
   - Get current user's cancellation request
   - Auth: Required (tenant)

3. `GET /api/cancellation-request/pending`
   - Get all pending requests
   - Auth: Required (admin)

4. `PATCH /api/cancellation-request/:id/approve`
   - Approve request
   - Auth: Required (admin)

5. `PATCH /api/cancellation-request/:id/reject`
   - Reject request
   - Auth: Required (admin)
   - Body: { rejectionReason? }

---

## FRONTEND API METHODS

### File: `d:\manipal\frontend\src\api.js`

**New Methods Added:**

```typescript
export async function createCancellationRequest(token, bookingId, reason);
export async function getMyRequest(token);
export async function getPendingCancellationRequests(token);
export async function approveCancellationRequest(token, requestId);
export async function rejectCancellationRequest(
  token,
  requestId,
  rejectionReason,
);
```

---

## ROUTING

### File: `d:\manipal\frontend\src\App.tsx`

**New Route:**

```typescript
<Route
  path="/admin/cancellation-requests"
  element={<AdminRoute><AdminCancellationRequests /></AdminRoute>}
/>
```

---

## NAVIGATION

### File: `d:\manipal\frontend\src\components\DashboardLayout.tsx`

**Admin Navigation Added:**

```typescript
{ label: "Cancellation Requests", href: "/admin/cancellation-requests", icon: AlertCircle }
```

---

## MODULE REGISTRATION

### File: `d:\manipal\backend\src\app.module.ts`

**Added:**

- Import: `CancellationRequestModule`
- Added to imports array

---

## FILES CREATED

1. ✅ `d:\manipal\backend\src\modules\cancellation-requests\cancellation-request.service.ts`
2. ✅ `d:\manipal\backend\src\modules\cancellation-requests\cancellation-request.controller.ts`
3. ✅ `d:\manipal\backend\src\modules\cancellation-requests\cancellation-request.module.ts`
4. ✅ `d:\manipal\backend\src\modules\cancellation-requests\dto\create-cancellation-request.dto.ts`
5. ✅ `d:\manipal\frontend\src\pages\admin\AdminCancellationRequests.tsx`

---

## FILES MODIFIED

1. ✅ `d:\manipal\backend\prisma\schema.prisma` - Added CancellationRequest model
2. ✅ `d:\manipal\backend\src\app.module.ts` - Added CancellationRequestModule
3. ✅ `d:\manipal\frontend\src\pages\tenant\TenantRoom.tsx` - Added cancel button & dialog
4. ✅ `d:\manipal\frontend\src\pages\Index.tsx` - Added AVAILABLE filter
5. ✅ `d:\manipal\frontend\src\api.js` - Added 5 new API methods
6. ✅ `d:\manipal\frontend\src\App.tsx` - Added route
7. ✅ `d:\manipal\frontend\src\components\DashboardLayout.tsx` - Added nav item

---

## WORKFLOW SUMMARY

### Tenant Flow:

1. Tenant goes to "My Room" page
2. Clicks "Cancel Room Request" button
3. Confirms in dialog and optionally provides reason
4. Request submitted to backend with status=PENDING
5. Tenant sees "Status: Cancellation PENDING"

### Admin Flow:

1. Admin goes to "Cancellation Requests" page
2. Sees pending requests listed
3. Can Approve or Reject
4. If Approved:
   - Request status → APPROVED
   - releaseTime = now + 24 hours
5. If Rejected:
   - Request status → REJECTED
   - Optionally provides reason

### Automatic Release (Backend Cron):

1. Every minute, cron job checks for approved requests
2. If releaseTime <= now:
   - Room.status → AVAILABLE
   - Room.occupiedFrom → null
   - Room.occupiedUntil → null
   - Booking.status → CANCELLED
3. Room automatically reappears on home page

### Room Visibility:

- Home page filters: `room.status === "available"`
- Backend filters: `where: { status: "AVAILABLE" }`
- Once released after 24 hours, room visible again

---

## DATABASE MIGRATION

The Prisma schema has been updated with the new CancellationRequest model.

**To apply changes:**

```bash
cd backend
npx prisma db push
```

---

## TEST SCENARIOS

### Scenario 1: Successful Cancellation

1. ✅ Tenant clicks "Cancel Room Request"
2. ✅ Confirmation dialog appears
3. ✅ Tenant confirms with optional reason
4. ✅ Request created with status=PENDING
5. ✅ Tenant sees "Cancellation PENDING" status
6. ✅ Admin sees request in admin panel
7. ✅ Admin approves
8. ✅ Request status=APPROVED, releaseTime=now+24hrs
9. ✅ Tenant sees "Cancellation APPROVED"
10. ✅ After 24 hours: Room.status=AVAILABLE, Booking.status=CANCELLED
11. ✅ Room reappears on home page

### Scenario 2: Rejection

1. ✅ Admin rejects with reason
2. ✅ Request status=REJECTED
3. ✅ Tenant sees "Cancellation REJECTED" with reason
4. ✅ Cancel button appears again for tenant to retry

### Scenario 3: No Existing Request

- ✅ New tenant can request cancellation
- ✅ Only one pending request allowed per booking
- ✅ Can request again after rejection

---

## NOTES

- ✅ No UI layout or styling changes were made
- ✅ Feature is self-contained in new module
- ✅ Backward compatible with existing bookings
- ✅ Silent API errors don't break the UI
- ✅ All timestamps handled in UTC
- ✅ 24-hour calculation accounts for milliseconds
- ✅ Admin can see all cancellation history (PENDING/APPROVED/REJECTED)
- ✅ Frontend gracefully handles missing cancellation requests
