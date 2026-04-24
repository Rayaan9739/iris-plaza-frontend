--
-- PostgreSQL database dump
--

\restrict Pj1Ww3bUSiTEUGoa3CUWQPxJOx4d2ohm5Si8VLC0tymQdJWBLR69ksihyfsby6a

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'REJECTED'
);


--
-- Name: AgreementStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AgreementStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'PENDING_SIGNATURE',
    'SIGNED',
    'EXPIRED'
);


--
-- Name: BookingSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingSource" AS ENUM (
    'WALK_IN',
    'BROKER'
);


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'PENDING_APPROVAL',
    'RESERVED',
    'VERIFICATION_PENDING',
    'APPROVED_PENDING_PAYMENT',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);


--
-- Name: CancellationRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CancellationRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'REJECTED'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'AADHAAR',
    'COLLEGE_ID',
    'TENANT_PHOTO',
    'ID_CARD',
    'PROOF_OF_INCOME',
    'ADDRESS_PROOF',
    'PHOTO',
    'AGREEMENT',
    'OTHER'
);


--
-- Name: ExtensionRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExtensionRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ',
    'UNREAD'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'SMS',
    'EMAIL',
    'PUSH',
    'RENT_REMINDER',
    'RENT_OVERDUE',
    'PAYMENT_APPROVED',
    'PAYMENT_REJECTED',
    'DOCUMENT_APPROVED',
    'DOCUMENT_REJECTED',
    'MAINTENANCE_UPDATE',
    'ANNOUNCEMENT',
    'SYSTEM'
);


--
-- Name: PaymentGateway; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentGateway" AS ENUM (
    'RAZORPAY',
    'CASHFREE'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'ONLINE',
    'CASH',
    'UPI',
    'BANK_TRANSFER'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'PARTIAL',
    'NEEDS_REVIEW',
    'PENDING_VERIFICATION'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'BOOKING_FEE',
    'RENT',
    'DEPOSIT',
    'LATE_FEE',
    'OTHER'
);


--
-- Name: RentCycleStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RentCycleStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'PARTIALLY_PAID'
);


--
-- Name: RoomStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoomStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'OCCUPIED',
    'MAINTENANCE'
);


--
-- Name: RoomType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoomType" AS ENUM (
    'ONE_BHK',
    'TWO_BHK',
    'PENT_HOUSE',
    'SINGLE',
    'DOUBLE',
    'STUDIO',
    'SUITE',
    'THREE_BHK',
    'PENTHOUSE'
);


--
-- Name: TenantType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TenantType" AS ENUM (
    'ACTIVE',
    'FUTURE'
);


--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'TENANT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agreements (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "agreementUrl" text,
    status public."AgreementStatus" DEFAULT 'DRAFT'::public."AgreementStatus" NOT NULL,
    "tenantSigned" boolean DEFAULT false NOT NULL,
    "tenantSignedAt" timestamp(3) without time zone,
    "adminSigned" boolean DEFAULT false NOT NULL,
    "adminSignedAt" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "monthlyRent" numeric(10,2) NOT NULL,
    "securityDeposit" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amenities (
    id text NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    changes jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booking_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_status_history (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    status public."BookingStatus" NOT NULL,
    comment text,
    "changedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roomId" text NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "moveInDate" timestamp(3) without time zone,
    "moveOutDate" timestamp(3) without time zone,
    "checkoutDate" timestamp(3) without time zone,
    "bookingFee" numeric(10,2),
    "bookingFeePaid" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "bookingSource" public."BookingSource" DEFAULT 'WALK_IN'::public."BookingSource" NOT NULL,
    "brokerName" text,
    "rentAmount" numeric(10,2),
    "tenantType" public."TenantType" DEFAULT 'ACTIVE'::public."TenantType" NOT NULL,
    "expectedMoveIn" timestamp(3) without time zone,
    "bookingDate" timestamp(3) without time zone
);


--
-- Name: cancellation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cancellation_requests (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "tenantId" text NOT NULL,
    reason text,
    status public."CancellationRequestStatus" DEFAULT 'PENDING'::public."CancellationRequestStatus" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectionReason" text,
    "releaseTime" timestamp(3) without time zone,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id text NOT NULL,
    "userId" text NOT NULL,
    "bookingId" text,
    name text NOT NULL,
    type public."DocumentType" NOT NULL,
    "fileUrl" text NOT NULL,
    "fileName" text,
    "fileSize" integer,
    "mimeType" text,
    status public."DocumentStatus" DEFAULT 'PENDING'::public."DocumentStatus" NOT NULL,
    "rejectReason" text,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: extension_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extension_requests (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "tenantId" text NOT NULL,
    "currentCheckoutDate" timestamp(3) without time zone NOT NULL,
    "requestedCheckoutDate" timestamp(3) without time zone NOT NULL,
    reason text,
    status public."ExtensionRequestStatus" DEFAULT 'PENDING'::public."ExtensionRequestStatus" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: maintenance_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_tickets (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "bookingId" text,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    "requestedAmount" numeric(10,2),
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    resolution text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otps (
    id text NOT NULL,
    phone text NOT NULL,
    "hashedOtp" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "attemptsCount" integer DEFAULT 0 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tenantId" text,
    "roomId" text,
    "bookingId" text,
    "rentCycleId" text,
    "invoiceId" text,
    amount numeric(10,2) NOT NULL,
    "rentAmount" numeric(10,2),
    "paidAmount" numeric(10,2),
    "pendingAmount" numeric(10,2),
    "amountPaid" numeric(10,2),
    "borrowedAmount" numeric(10,2),
    "remainingAmount" numeric(10,2),
    month text NOT NULL,
    type public."PaymentType" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod" DEFAULT 'ONLINE'::public."PaymentMethod",
    "screenshotUrl" text,
    "transactionId" text,
    "transactionDate" timestamp(3) without time zone,
    "paymentDate" timestamp(3) without time zone,
    gateway public."PaymentGateway",
    "gatewayOrderId" text,
    "gatewayPaymentId" text,
    "gatewaySignature" text,
    description text,
    "invoiceUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: rent_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rent_cycles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "bookingId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "paidDate" timestamp(3) without time zone,
    status public."RentCycleStatus" DEFAULT 'PENDING'::public."RentCycleStatus" NOT NULL,
    "lateFee" numeric(10,2),
    "lateFeeApplied" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: room_amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_amenities (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "amenityId" text NOT NULL
);


--
-- Name: room_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_images (
    id text NOT NULL,
    "roomId" text NOT NULL,
    url text NOT NULL,
    caption text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: room_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_media (
    id text NOT NULL,
    "roomId" text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: room_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_rules (
    id bigint NOT NULL,
    room_id text NOT NULL,
    rule text NOT NULL
);


--
-- Name: room_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.room_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: room_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.room_rules_id_seq OWNED BY public.room_rules.id;


--
-- Name: room_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_transfers (
    id bigint NOT NULL,
    booking_id text NOT NULL,
    user_id text NOT NULL,
    from_room_id text NOT NULL,
    to_room_id text NOT NULL,
    effective_date timestamp with time zone NOT NULL,
    desired_move_out_date timestamp with time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: room_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.room_transfers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: room_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.room_transfers_id_seq OWNED BY public.room_transfers.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    name text NOT NULL,
    type public."RoomType" NOT NULL,
    description text,
    floor integer NOT NULL,
    area integer NOT NULL,
    rent numeric(10,2) NOT NULL,
    deposit numeric(10,2) NOT NULL,
    status public."RoomStatus" DEFAULT 'AVAILABLE'::public."RoomStatus" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "occupiedFrom" timestamp(3) without time zone,
    "occupiedUntil" timestamp(3) without time zone,
    "availableAt" timestamp(3) without time zone,
    "videoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "managementIsAvailable" boolean DEFAULT true,
    "managementOccupiedUntil" timestamp(3) without time zone,
    "managementRent" numeric(10,2),
    "managementStatus" public."RoomStatus" DEFAULT 'AVAILABLE'::public."RoomStatus"
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: tenant_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    occupation text,
    "companyName" text,
    "monthlyIncome" numeric(10,2),
    "emergencyName" text,
    "emergencyPhone" text,
    "emergencyRelation" text,
    "kycStatus" text DEFAULT 'NOT_STARTED'::text NOT NULL,
    "kycVerifiedAt" timestamp(3) without time zone,
    "moveInDate" timestamp(3) without time zone,
    "moveOutDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text,
    phone text NOT NULL,
    password text,
    role public."UserRole" DEFAULT 'TENANT'::public."UserRole" NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "accountStatus" public."AccountStatus" DEFAULT 'PENDING'::public."AccountStatus" NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "emailVerifyToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    dob timestamp(3) without time zone
);


--
-- Name: room_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_rules ALTER COLUMN id SET DEFAULT nextval('public.room_rules_id_seq'::regclass);


--
-- Name: room_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_transfers ALTER COLUMN id SET DEFAULT nextval('public.room_transfers_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
1b6d3046-2f2b-4fd5-a086-dc324698a37a	iris plaza	ep-dark-smoke-ai28its9	2026-03-03 20:06:30.287+05:30	2026-03-03 20:06:30.287+05:30	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"organization": {"config": {"creatorRole": "owner", "organizationLimit": 1, "allowUserToCreateOrganization": true}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
56e6b2ff-1e9f-4ecc-92a9-4919b05109fd	390551d055000369319d64c1669b9fd3f77811e56d4ba13554b5dd1f36595f26	2026-03-18 23:53:58.688004+05:30	20260310074713_init	\N	\N	2026-03-18 23:53:55.633467+05:30	1
30b87ef9-c7ae-461d-b95e-b32e30a53b59	df5495e5b7ef7540937a758bea1baeee4609be782c2e5aa270f791bd5f61374e	2026-03-19 12:44:32.09837+05:30	20260319071429_add_booking_source_and_broker_name	\N	\N	2026-03-19 12:44:30.86207+05:30	1
d440572d-9672-4ff7-834c-445758eed199	364849e918efb6febbf769fe4aaac6c7f0a7a8584b4d4e1014b4165896176da6	2026-03-24 09:38:37.078294+05:30	20260319143000_enforce_booking_source_not_null	\N	\N	2026-03-24 09:38:34.926305+05:30	1
\.


--
-- Data for Name: agreements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agreements (id, "bookingId", "agreementUrl", status, "tenantSigned", "tenantSignedAt", "adminSigned", "adminSignedAt", "startDate", "endDate", "monthlyRent", "securityDeposit", "createdAt", "updatedAt") FROM stdin;
515af781-3847-4348-9190-0835f29eaa96	f45b30bb-954e-4e73-a592-bc8bfeb0a895	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1774354188/iris-plaza/agreement/agreement_f45b30bb-954e-4e73-a592-bc8bfeb0a895.docx	PENDING_SIGNATURE	f	\N	f	\N	2026-03-25 00:00:00	2026-03-27 00:00:00	20000.00	50000.00	2026-03-24 12:09:52.478	2026-03-24 12:09:52.476
8c8630f4-3225-43ee-96f5-7abc3bc27bcb	86d583eb-47d8-4689-8d6e-358a0c57b583	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1774724629/iris-plaza/agreement/agreement_86d583eb-47d8-4689-8d6e-358a0c57b583.docx	PENDING_SIGNATURE	f	\N	f	\N	2026-03-30 00:00:00	2026-03-31 00:00:00	20000.00	12000.00	2026-03-28 19:03:53.317	2026-03-28 19:03:53.315
041ca095-2bd7-4829-9795-72a580c17e1c	ee403659-33fb-4738-8f71-aa8a30b5308f	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1775211691/iris-plaza/agreement/agreement_ee403659-33fb-4738-8f71-aa8a30b5308f.docx	PENDING_SIGNATURE	f	\N	f	\N	2026-04-03 00:00:00	2026-04-04 00:00:00	20000.00	50000.00	2026-04-03 10:21:37.287	2026-04-03 10:21:37.285
\.


--
-- Data for Name: amenities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.amenities (id, name, icon, description, "createdAt") FROM stdin;
26a9b4ca-f968-423b-ae26-c3d2e2692446	Air Conditioner	\N	\N	2026-03-18 19:14:43.842
d22c4428-8508-4dd2-8f38-7ce189a5609f	Wardrobe	\N	\N	2026-03-18 19:14:43.842
657480ca-7532-4af1-a318-da2913479a0e	Sofa	\N	\N	2026-03-18 19:14:43.842
a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308	Washing Machine	\N	\N	2026-03-18 19:14:43.842
8768ff0e-8105-4d94-9a44-53ef05b7b4e7	Refrigerator	\N	\N	2026-03-18 19:14:43.842
072c8a4f-d84d-45fc-af2a-1f0186742e29	2 Single Bed	\N	\N	2026-03-18 19:14:43.842
f72d4d9c-3000-406c-8cc1-be093dc1de57	Water Purifier	\N	\N	2026-03-18 19:14:43.842
a8dbd99e-f577-4d18-b146-861aeb1197ee	Kitchen Cabinet	\N	\N	2026-03-19 07:15:27.826
7b1e23af-ba06-482e-a09b-41376eef3061	AC IN HALL	\N	\N	2026-03-19 07:59:48.222
8aae2daa-5961-4663-a346-89df54ffc405	2 seperate room with attach bathroom	\N	\N	2026-03-21 07:56:21.308
2fdc9afc-9716-4685-9dbe-61fa7ee00463	WIFI	\N	\N	2026-03-28 15:07:43.207
deec55d1-a711-472e-a229-57747b6eb403	KITCHEN SET	\N	\N	2026-04-03 10:17:24.514
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, entity, "entityId", changes, "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_status_history (id, "bookingId", status, comment, "changedBy", "createdAt") FROM stdin;
e7ee5569-2c20-4ff4-b48b-9c338bfa6f9e	f45b30bb-954e-4e73-a592-bc8bfeb0a895	PENDING_APPROVAL	Booking request submitted (rent 20000, deposit 50000). Waiting for admin approval.	\N	2026-03-24 12:07:58.791
3bb75406-7dc2-4d35-8881-6adc52bce3f0	f45b30bb-954e-4e73-a592-bc8bfeb0a895	APPROVED	Booking request approved by admin.	\N	2026-03-24 12:10:03.716
76dbcb13-a935-4c7d-b3d3-c56b45322e35	f45b30bb-954e-4e73-a592-bc8bfeb0a895	CANCELLED	Tenant removed by admin	\N	2026-03-24 15:26:25.311
b4e43a0f-ae8e-434b-bd2c-5f48dedf653e	86d583eb-47d8-4689-8d6e-358a0c57b583	PENDING_APPROVAL	Booking request submitted (rent 20000, deposit 12000). Waiting for admin approval.	\N	2026-03-28 19:01:07.897
ce16b313-4cbe-4e9b-92f9-ca1abde3c8f3	86d583eb-47d8-4689-8d6e-358a0c57b583	APPROVED	Booking request approved by admin.	\N	2026-03-28 19:04:01.155
185b6644-4cf9-4cd3-8ab4-6665613d4759	86d583eb-47d8-4689-8d6e-358a0c57b583	CANCELLED	Tenant removed by admin	\N	2026-03-30 07:16:20.561
2ff30e99-6e43-4238-bdef-611068e4700c	4fe88d06-e296-47dc-822d-e6db0206740b	PENDING_APPROVAL	Booking request submitted (rent 23000, deposit 50000). Waiting for admin approval.	\N	2026-03-30 08:22:12.408
9a5ab335-ca53-40c5-a19c-5282704f7880	4fe88d06-e296-47dc-822d-e6db0206740b	REJECTED	Booking rejected by admin	\N	2026-03-30 08:39:41.43
1c84e778-361d-4b79-b145-0f84707352e2	3fe6a14f-0145-4ddf-b55e-64169a7a3bd2	PENDING_APPROVAL	Booking request submitted (rent 28000, deposit 50000). Waiting for admin approval.	\N	2026-04-01 16:05:13.091
81813842-2caf-4810-b0f5-83650cd9143b	3fe6a14f-0145-4ddf-b55e-64169a7a3bd2	REJECTED	Booking rejected by admin	\N	2026-04-01 16:05:38.195
8b19c0e9-c6ba-4442-ad6c-92cc03b6c622	ee403659-33fb-4738-8f71-aa8a30b5308f	PENDING_APPROVAL	Booking request submitted (rent 20000, deposit 50000). Waiting for admin approval.	\N	2026-04-03 10:21:02.146
78c832f8-e965-4ac7-9b7c-f55b4f6c187c	ee403659-33fb-4738-8f71-aa8a30b5308f	APPROVED	Booking request approved by admin.	\N	2026-04-03 10:21:37.316
b7030643-8c93-4177-a54b-836701c434f4	0957c02b-16a8-4fb9-96fd-907b866b539c	APPROVED	Future booking created by admin (offline). Expected move-in: 2026-04-05	\N	2026-04-03 10:25:14.196
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, "userId", "roomId", status, "startDate", "endDate", "moveInDate", "moveOutDate", "checkoutDate", "bookingFee", "bookingFeePaid", "expiresAt", "createdAt", "updatedAt", "deletedAt", "bookingSource", "brokerName", "rentAmount", "tenantType", "expectedMoveIn", "bookingDate") FROM stdin;
073cc921-92f6-4e34-81c1-ba53ada90991	65ef83e4-94ba-4bae-b2c7-5cad77089f18	ae780740-6d72-41ca-9ea9-81ba82c1f662	APPROVED	2026-03-19 21:16:57.35	2026-09-19 21:16:57.35	2026-03-19 21:16:57.35	2026-09-19 21:16:57.35	2026-09-19 21:16:57.35	\N	f	\N	2026-03-19 21:16:57.35	2026-03-30 06:27:32.626	\N	BROKER	LATHEEF	19000.00	ACTIVE	\N	2026-04-02 01:31:23.661
b2c94eb6-4d48-4186-8662-33c4980d7a61	1aed8ae8-a336-4e29-be61-f193f028d011	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:33:48.115	\N	WALK_IN	\N	26500.00	ACTIVE	\N	2026-04-02 01:31:23.661
86d583eb-47d8-4689-8d6e-358a0c57b583	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	febfdbc4-874a-459c-8309-6ee0f7b96a8e	CANCELLED	2026-03-30 00:00:00	2026-03-31 00:00:00	2026-03-30 00:00:00	2026-03-31 00:00:00	2026-03-31 00:00:00	\N	f	\N	2026-03-28 19:01:07.897	2026-03-30 07:16:20.446	\N	BROKER	aslam	19500.00	ACTIVE	\N	2026-04-02 01:31:23.661
43bc7fca-a9b0-4db6-99de-9f1c0df8f12e	49f469a5-78de-4bc7-85c9-c4fccea3b4fc	268cd00c-dad9-40f7-9d91-d04d374de71d	APPROVED	2026-03-19 21:14:43.78	2026-11-30 00:00:00	2026-03-19 21:14:43.78	2026-11-30 00:00:00	2026-09-19 21:14:43.78	\N	f	\N	2026-03-19 21:14:43.78	2026-03-30 07:17:06.564	\N	BROKER	LATIF	19500.00	ACTIVE	\N	2026-04-02 01:31:23.661
e663c553-85a0-447b-97c8-a6467fe20226	5f229753-5b26-4f40-9eb9-58ecb34268bd	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	APPROVED	2026-03-19 21:17:15.605	2026-09-19 21:17:15.605	2026-03-19 21:17:15.605	2026-09-19 21:17:15.605	2026-09-19 21:17:15.605	\N	f	\N	2026-03-19 21:17:15.605	2026-03-30 06:28:17.93	\N	WALK_IN	\N	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
c365e40d-3740-4481-947b-5caf6adcb309	c3b858c4-72b7-48e9-b0f5-5b61dbb11358	ad4288c3-dc75-46e2-b727-71f2e8a57099	APPROVED	2026-03-19 21:17:27.08	2026-09-19 21:17:27.08	2026-03-19 21:17:27.08	2026-09-19 21:17:27.08	2026-09-19 21:17:27.08	\N	f	\N	2026-03-19 21:17:27.08	2026-03-30 06:28:34.558	\N	BROKER	SHIVMANI	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
20fd03a3-89aa-43cf-8254-9c66a185db25	de8adcc0-05f6-427b-b09a-7676b49aa5e0	3f12f2f7-76b4-4981-900e-d12336f9ae23	APPROVED	2026-03-19 21:17:42.39	2026-09-19 21:17:42.39	2026-03-19 21:17:42.39	2026-09-19 21:17:42.39	2026-09-19 21:17:42.39	\N	f	\N	2026-03-19 21:17:42.39	2026-03-30 06:29:29.67	\N	WALK_IN	\N	18250.00	ACTIVE	\N	2026-04-02 01:31:23.661
4df96b7a-1d4f-402d-84a8-2f17a056a867	6052e510-3d6a-40a8-a4d1-c84de1d06050	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	APPROVED	2026-03-24 12:34:14.049	2026-12-31 00:00:00	2026-03-24 12:34:14.049	2026-12-31 00:00:00	2026-09-24 12:34:14.049	\N	f	\N	2026-03-24 12:34:14.049	2026-03-30 06:29:46.776	\N	BROKER	ZAHEER	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
44eec2a6-d65b-4866-966e-4bceff165619	44e00b99-2324-4b3f-9704-54508b2f0e78	8baea0eb-0064-41b8-bd22-0c89d95929a6	APPROVED	2026-03-24 12:34:14.049	2026-08-01 00:00:00	2026-03-24 12:34:14.049	2026-08-01 00:00:00	2026-09-24 12:34:14.049	\N	f	\N	2026-03-24 12:34:14.049	2026-03-30 06:30:13.691	\N	BROKER	LATIF	18375.00	ACTIVE	\N	2026-04-02 01:31:23.661
f45b30bb-954e-4e73-a592-bc8bfeb0a895	048db42a-dbee-4682-bc13-5b1f0212eaa0	f41c090a-fa90-4643-8c7b-34dc7493ded1	CANCELLED	2026-03-25 00:00:00	2026-03-27 00:00:00	2026-03-25 00:00:00	2026-03-27 00:00:00	2026-03-27 00:00:00	\N	f	\N	2026-03-24 12:07:58.791	2026-03-24 15:26:24.488	\N	BROKER	rayaan	\N	ACTIVE	\N	2026-04-02 01:31:23.661
acfae448-a503-4601-8d67-001dac63d46a	6e73600f-145f-4471-b95c-a2c113d08aa6	91da7ef2-f322-4fab-b845-9cb701e848aa	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:30:27.4	\N	BROKER	LATHIF	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
fa71f445-efba-4594-91ce-77f106a1c631	2a90a822-ac46-4639-b385-288e0ae98874	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:31:06.673	\N	BROKER	LATHIF	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
4fe88d06-e296-47dc-822d-e6db0206740b	e558c5f6-72a9-416b-b80b-e8b4fa242e75	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	REJECTED	2026-03-31 00:00:00	2029-03-31 00:00:00	2026-03-31 00:00:00	2029-03-31 00:00:00	2029-03-31 00:00:00	\N	f	2026-03-30 08:39:40.612	2026-03-30 08:22:12.408	2026-03-30 08:39:40.734	\N	WALK_IN	\N	\N	ACTIVE	\N	2026-04-02 01:31:23.661
eaba3be9-7c27-4209-a6be-1dbdc5b32d72	91d30180-6ecd-44e7-ab14-07c099b1830d	e1668d3f-1c54-4f8e-80c8-2978206232ae	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:33:10.005	\N	BROKER	LATHIF	19350.00	ACTIVE	\N	2026-04-02 01:31:23.661
39e9d5c7-79f3-40fb-b680-c151c45ecc80	61fc6e99-775e-4533-8618-86103eded40f	4f87f3de-0452-45ad-8dbb-598e58b27d81	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:33:25.751	\N	BROKER	LATHIF	19000.00	ACTIVE	\N	2026-04-02 01:31:23.661
77ecae59-ed90-4e18-a8df-1fdf7f5df21c	4eec2bc6-dd60-4fbc-820a-b32b51f994a2	72cf67bd-7d1f-4952-8013-75b0ad7f4677	APPROVED	2026-03-24 12:34:14.049	2026-06-30 00:00:00	2026-03-24 12:34:14.049	2026-06-30 00:00:00	2026-09-24 12:34:14.049	\N	f	\N	2026-03-24 12:34:14.049	2026-03-28 12:38:27.673	\N	BROKER	LATHEEF	19000.00	ACTIVE	\N	2026-04-02 01:31:23.661
7e9ddde4-c3f6-4147-8fba-22487fd74b25	741a0096-6bff-4967-bc2a-82f9f5c9ad04	f3c7b348-1234-42d8-94ad-8490df57863a	APPROVED	2026-03-19 21:16:40.01	2027-02-02 00:00:00	2026-03-19 21:16:40.01	2027-02-02 00:00:00	2026-09-19 21:16:40.01	\N	f	\N	2026-03-19 21:16:40.01	2026-03-24 08:23:08.514	\N	BROKER	LATHEEF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
2ed88f30-a53a-439e-9c91-b5fd5d26130a	6d509995-7d3c-4950-9108-ef835d53cb8f	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 08:34:15.155	\N	BROKER	LATHIF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
a5eccde6-e29e-4a52-bf0b-f43212be077a	ab178d92-68f1-4aad-83ef-819d82edff00	e06741c9-66c3-40a8-a253-7c54413a8a93	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 08:38:02.122	\N	BROKER	LATHIF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
f4a97819-19a6-438f-b21e-af89ab9bb080	fae21f70-451b-4976-999b-16ae69a63a41	78080f63-ca42-4303-a261-4641a275237f	APPROVED	2026-03-19 21:39:45.022	2026-12-31 00:00:00	2026-03-19 21:39:45.022	2026-12-31 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 09:24:32.419	\N	BROKER	LATHIF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
8fc756a5-4a50-4c93-88b2-505e2e152ea9	29bcb55d-fea4-4e2f-a1f1-086fd14f41c4	e75bebe3-f0be-4c97-9362-080110ae7ed7	APPROVED	2026-03-19 21:39:45.022	2026-12-31 00:00:00	2026-03-19 21:39:45.022	2026-12-31 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 09:26:02.533	\N	BROKER	LATHIF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
02f8b4c6-37ad-459b-aa18-9103d9e38151	82d784ba-0343-4e07-aca7-7b0c71ca4ce2	984dab09-fbc5-4954-a2a9-c259911413fe	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:34:28.548	\N	WALK_IN	\N	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
aef01c17-c340-4f43-b4a7-93f0da9825b2	bb012c88-9588-4ea3-807f-4e5e56bdc805	f237f8ee-4610-4d33-ac93-c07f59233888	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:34:48.148	\N	BROKER	LATHIF	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
5a31eb5f-cc09-4a53-9dd6-171b48117799	4d9f50a6-83a4-41c1-919a-e0fb15c91353	ea15fc00-7111-46df-9624-bf7d6b1fc057	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:35:03.905	\N	WALK_IN	\N	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
3b643d4f-7d51-4503-be48-4896dae66dae	a2bacbcc-b5cb-49ea-ac06-c5a99e2b9a50	32be656f-810d-49ef-9c67-af54895403a6	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:35:54.861	\N	BROKER	LATHIF	28000.00	ACTIVE	\N	2026-04-02 01:31:23.661
a1fa2311-1e75-452d-9d39-99af6fcccfe7	dc4bd9fd-f14b-4762-8b59-de77427582be	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	APPROVED	2026-03-19 21:39:45.022	2026-04-30 00:00:00	2026-03-19 21:39:45.022	2026-04-30 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:36:13.026	\N	BROKER	PRAKASH	22000.00	ACTIVE	\N	2026-04-02 01:31:23.661
a9507e3c-b28e-49f5-a473-849f958175d6	1546f1f8-7709-4403-bcc1-91681d13021c	c5a9766d-4162-4a24-b7fb-df0c5107bca2	APPROVED	2026-03-19 21:39:45.022	2026-06-13 00:00:00	2026-03-19 21:39:45.022	2026-06-13 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:36:43.617	\N	BROKER	LATHEEF	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
c78c47be-116e-4830-9360-1588719488ea	17632dcd-fbbf-429b-a955-12628d76606d	55ee460d-7d0c-4de9-9cda-04e1be396e9d	APPROVED	2026-03-19 21:39:45.022	2026-06-30 00:00:00	2026-03-19 21:39:45.022	2026-06-30 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:37:05.083	\N	BROKER	LATHIF	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
c9f36683-d965-4fcf-9d2a-d2113e555d51	de9d9a1f-9330-40c7-85fa-fd3e4a0b800b	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	APPROVED	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-03-19 21:39:45.022	2026-09-19 21:39:45.022	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-19 21:39:45.022	\N	WALK_IN	\N	\N	ACTIVE	\N	2026-04-02 01:31:23.661
ecac7518-5388-4d4d-a964-bf04eb87fe23	943888d3-e0c8-4239-85b2-ef4c267c9d53	c3baacd5-6a2c-4568-87d3-b1412ec697d4	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-19 21:42:41.842	\N	WALK_IN	\N	\N	ACTIVE	\N	2026-04-02 01:31:23.661
b8a94ab9-b782-427c-8ec2-b4a481466991	ae6d66e3-5354-477e-8479-1d40c925cd95	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	APPROVED	2026-03-19 21:42:41.842	2026-05-20 00:00:00	2026-03-19 21:42:41.842	2026-05-20 00:00:00	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:47:35.898	\N	WALK_IN	\N	22000.00	ACTIVE	\N	2026-04-02 01:31:23.661
1dadc894-d7d2-483f-8fea-0ea0012d6ce4	fa7f45a9-046c-4060-af50-06d68307e016	17deaf36-d2f5-4c45-af32-94d207a5f69d	APPROVED	2026-03-19 21:39:45.022	2026-05-31 00:00:00	2026-03-19 21:39:45.022	2026-05-31 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 09:28:58.254	\N	BROKER	LATHIF	\N	ACTIVE	\N	2026-04-02 01:31:23.661
f3cb8d86-38c4-458b-81e5-152bc121cf41	39a95ccb-bfcc-45e0-b1eb-c78c8d02e467	f8e35850-947d-41a7-a2a1-84bc08785a92	APPROVED	2026-03-19 21:39:45.022	2026-05-19 00:00:00	2026-03-19 21:39:45.022	2026-05-19 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:39:43.651	\N	BROKER	LATHIF	19000.00	ACTIVE	\N	2026-04-02 01:31:23.661
fef306bd-cf97-4c0b-8499-6165bf6d0d02	8a25da7b-af72-45c2-ad2c-4425116cf466	ee5684cd-dc56-4e7f-818d-64a40135ee57	APPROVED	2026-03-19 21:42:41.842	2027-02-10 00:00:00	2026-03-19 21:42:41.842	2027-02-10 00:00:00	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-24 19:10:18.808	\N	WALK_IN	\N	\N	ACTIVE	\N	2026-04-02 01:31:23.661
75371856-0f61-46e9-b186-3c0a8485dbc0	0905d563-47d7-4c82-b75f-8c02cf791bca	0250c85a-8d59-4045-8103-1ecb5e030537	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:13:44.945	\N	BROKER	LATIF	23000.00	ACTIVE	\N	2026-04-02 01:31:23.661
4b42de8b-b4eb-49bf-8d9e-6c659d08bca4	f365f3d6-8a96-4f98-977c-eba47c925830	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:42:19.671	\N	WALK_IN	\N	22500.00	ACTIVE	\N	2026-04-02 01:31:23.661
19442349-c1a5-44ce-af63-a435fd2d7af8	902643cf-68cf-44a8-9034-4eb230e93013	32ca3d58-2527-4536-95d3-b0e1a68065e8	APPROVED	2026-03-19 21:39:45.022	2027-04-15 00:00:00	2026-03-19 21:39:45.022	2027-04-15 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-24 09:32:04.215	\N	BROKER	GIRISH	\N	ACTIVE	\N	2026-04-02 01:31:23.661
84403973-19bd-4245-b26c-6b1091fc2d0a	709e6da4-07b1-46da-8e39-6b776b0db3a2	c163cd2f-ffc1-4096-84b6-407547820de6	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:08:36.258	\N	BROKER	ZAHEER	20000.00	ACTIVE	\N	2026-04-02 01:31:23.661
9ab56f75-ad29-4286-82e0-2ecfe3116232	5a061c77-ac97-47df-9413-4a77a870cc7c	47caa164-b374-44ea-a106-4bb4fd669148	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:43:37.872	\N	WALK_IN	\N	22000.00	ACTIVE	\N	2026-04-02 01:31:23.661
5c1438d8-38d2-4750-82c5-f6e66ed79f3c	16e4816c-a7fc-49b4-b97e-c2b9cba45d24	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	APPROVED	2026-03-24 07:24:26.878	2026-10-31 00:00:00	2026-03-24 07:24:26.878	2026-10-31 00:00:00	\N	\N	f	\N	2026-03-24 07:24:26.906	2026-03-30 06:32:11.946	\N	BROKER	LATHEEF	19250.00	ACTIVE	\N	2026-04-02 01:31:23.661
7ba47122-4168-45b3-9845-57c539ee2d3f	43419cca-2e1e-4228-8e81-1fa927609ddd	a8d71a94-a068-4d50-87d8-cbfca70d2c29	APPROVED	2026-03-19 21:39:45.022	2026-11-15 00:00:00	2026-03-19 21:39:45.022	2026-11-15 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:38:01.925	\N	WALK_IN	\N	18500.00	ACTIVE	\N	2026-04-02 01:31:23.661
2c234950-bd02-458a-9c72-bfd53f83552d	7928928f-6f94-4cf4-87c4-6b15acdf7daa	70b83387-b52d-4634-95cb-847a74ca6ea7	APPROVED	2026-03-19 21:39:45.022	2026-11-30 00:00:00	2026-03-19 21:39:45.022	2026-11-30 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 07:20:25.378	\N	BROKER	LATHEEF	18000.00	ACTIVE	\N	2026-04-02 01:31:23.661
a860454d-2c46-496e-b637-07d40fe527aa	7e700586-4e2a-41a2-8049-466263b60cf4	50248627-b1ee-4a7e-b277-030d6630d5de	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:42:44.417	\N	WALK_IN	\N	24000.00	ACTIVE	\N	2026-04-02 01:31:23.661
a145c5d6-c580-4961-a767-e1c0d287d059	56a2709f-2a85-4445-8a1a-254ac29f9c62	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	APPROVED	2026-03-19 21:39:45.022	2026-07-31 00:00:00	2026-03-19 21:39:45.022	2026-07-31 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:38:22.86	\N	BROKER	LATHIF	18375.00	ACTIVE	\N	2026-04-02 01:31:23.661
9dbe9df0-315f-49fb-a70c-fbc262007dde	786f01ce-dff6-4653-b49a-ffde5202cf75	3461d1ba-93ee-4255-b744-c31afcc88870	APPROVED	2026-03-19 21:39:45.022	2027-05-14 00:00:00	2026-03-19 21:39:45.022	2027-05-14 00:00:00	2026-09-19 21:39:45.022	\N	f	\N	2026-03-19 21:39:45.022	2026-03-30 06:39:32.175	\N	BROKER	GIRISH	19000.00	ACTIVE	\N	2026-04-02 01:31:23.661
176df048-1ebb-4272-a3a6-d4b60f159b2a	e70447c5-99c5-44df-afa0-e5265522a0fc	4ce1e015-14b2-4457-8e03-c0f827ee81da	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:42:59.36	\N	WALK_IN	\N	21000.00	ACTIVE	\N	2026-04-02 01:31:23.661
e920ed70-9e2d-46bc-bd93-82864adf8df5	40df8ba3-2910-41ea-9fee-7539a8b7e053	1dae37f3-a38d-4a6e-a1cb-3997624e4172	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:43:19.985	\N	WALK_IN	\N	23000.00	ACTIVE	\N	2026-04-02 01:31:23.661
cb69903d-b8da-4fb6-977e-5b9034084ffc	4f7bdf65-7b9c-42bc-a2f8-a9f1a8e76c0e	a95cd978-e8f5-4094-9601-1129fd48c178	APPROVED	2026-03-19 21:42:41.842	2026-07-05 00:00:00	2026-03-19 21:42:41.842	2026-07-05 00:00:00	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:22:14.833	\N	WALK_IN	\N	28000.00	ACTIVE	\N	2026-04-02 01:31:23.661
317d9eb8-e84c-41e2-8503-6a16dd44ebc7	bd275241-a9a0-48d4-9f41-853a795a18b8	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:45:19.274	\N	WALK_IN	\N	22500.00	ACTIVE	\N	2026-04-02 01:31:23.661
41fb2aa3-4cce-4bd4-bfa9-96c168b77d69	560346ff-e0c6-408f-9b9c-0481d975d75f	2253584c-f96c-49b8-8205-ad4d9742f135	APPROVED	2026-03-19 21:42:41.842	2026-05-31 00:00:00	2026-03-19 21:42:41.842	2026-05-31 00:00:00	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 06:47:19.679	\N	WALK_IN	\N	30000.00	ACTIVE	\N	2026-04-02 01:31:23.661
96c03901-0bc1-4eaf-ad2b-7491f78e26fe	60c55148-df43-4724-884f-d22ac17e0f68	b53daec8-b909-4268-9211-0323217aba95	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:09:08.022	\N	BROKER	PRAKASH	20000.00	ACTIVE	\N	2026-04-02 01:31:23.661
a9e623b2-e880-4bea-874b-4463689e001c	49a1cae6-8ee3-4d43-89cb-e37b2ed5e370	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:09:31.497	\N	BROKER	LATIF	22000.00	ACTIVE	\N	2026-04-02 01:31:23.661
62c37233-fbf8-4033-9314-8ef50a84e35b	145c46de-2617-4d2b-9e9c-25af39ab0a9d	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:10:28.646	\N	BROKER	LATIF	22575.00	ACTIVE	\N	2026-04-02 01:31:23.661
9c72e9fe-1572-420b-b1ec-2a2173759f20	88669851-2727-45e7-9964-7ab4317e3304	fd073c81-b291-482d-81fe-9730027ff33a	APPROVED	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-03-19 21:42:41.842	2026-09-19 21:42:41.842	2026-09-19 21:42:41.842	\N	f	\N	2026-03-19 21:42:41.842	2026-03-30 07:13:19.246	\N	BROKER	LATEEF	23000.00	ACTIVE	\N	2026-04-02 01:31:23.661
3fe6a14f-0145-4ddf-b55e-64169a7a3bd2	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	1bbfe617-85b0-471b-aaa3-32f7778898f1	REJECTED	2026-10-10 00:00:00	2026-10-11 00:00:00	2026-10-10 00:00:00	2026-10-11 00:00:00	2026-10-11 00:00:00	\N	f	2026-04-01 16:05:38.185	2026-04-01 16:05:13.091	2026-04-01 16:05:38.189	\N	WALK_IN	\N	\N	ACTIVE	\N	2026-04-02 01:31:23.661
0957c02b-16a8-4fb9-96fd-907b866b539c	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	5613458c-6238-4943-b332-ff7aa8f845c7	APPROVED	2026-04-05 00:00:00	2026-04-06 00:00:00	2026-04-05 00:00:00	2026-04-06 00:00:00	\N	\N	f	\N	2026-04-03 10:25:14.196	2026-04-03 10:25:14.196	\N	BROKER	HABEEB	20000.00	FUTURE	2026-04-05 00:00:00	2026-04-03 10:25:14.194
ee403659-33fb-4738-8f71-aa8a30b5308f	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	5613458c-6238-4943-b332-ff7aa8f845c7	APPROVED	2026-04-03 00:00:00	2026-04-06 00:00:00	2026-04-03 00:00:00	2026-04-06 00:00:00	2026-04-04 00:00:00	\N	f	\N	2026-04-03 10:21:02.146	2026-04-03 10:25:14.217	\N	BROKER	MUNNA	20000.00	ACTIVE	\N	\N
\.


--
-- Data for Name: cancellation_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancellation_requests (id, "bookingId", "tenantId", reason, status, "approvedAt", "approvedBy", "rejectionReason", "releaseTime", "requestedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, "userId", "bookingId", name, type, "fileUrl", "fileName", "fileSize", "mimeType", status, "rejectReason", "verifiedBy", "verifiedAt", "uploadedAt", "reviewedAt", "updatedAt", "deletedAt") FROM stdin;
393ef205-1153-4364-a32c-32acd69d42de	048db42a-dbee-4682-bc13-5b1f0212eaa0	f45b30bb-954e-4e73-a592-bc8bfeb0a895	AADHAAR	COLLEGE_ID	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774354097/iris-plaza/documents/khgmtamqwfrbwc7p8jle.png	Screenshot 2025-12-06 110704.png	150507	image/png	SUBMITTED	\N	\N	\N	2026-03-24 12:08:22.821	\N	2026-03-24 12:08:22.821	\N
770af484-6c96-4a95-8f6c-1c877886aa48	048db42a-dbee-4682-bc13-5b1f0212eaa0	f45b30bb-954e-4e73-a592-bc8bfeb0a895	TENANT_PHOTO	TENANT_PHOTO	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774354102/iris-plaza/documents/kfok6uqnwrslvkm8moco.jpg	tenant-live-photo.jpg	56037	image/jpeg	SUBMITTED	\N	\N	\N	2026-03-24 12:08:26.937	\N	2026-03-24 12:08:26.937	\N
agreement-f45b30bb-954e-4e73-a592-bc8bfeb0a895	048db42a-dbee-4682-bc13-5b1f0212eaa0	f45b30bb-954e-4e73-a592-bc8bfeb0a895	Rental Agreement	AGREEMENT	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1774354188/iris-plaza/agreement/agreement_f45b30bb-954e-4e73-a592-bc8bfeb0a895.docx	agreement_f45b30bb-954e-4e73-a592-bc8bfeb0a895.docx	\N	\N	SUBMITTED	\N	\N	\N	2026-03-24 12:09:54.893	\N	2026-03-24 12:09:54.893	\N
836ab65b-7379-428f-9a48-be8231e22649	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	86d583eb-47d8-4689-8d6e-358a0c57b583	AADHAAR	COLLEGE_ID	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774724478/iris-plaza/documents/ych6advvn24vbn5u3kpr.jpg	adhaar.jpeg	84089	image/jpeg	SUBMITTED	\N	\N	\N	2026-03-28 19:01:23.564	\N	2026-03-28 19:01:23.564	\N
f2224c89-fcbe-4b15-885c-dde33d38c092	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	86d583eb-47d8-4689-8d6e-358a0c57b583	TENANT_PHOTO	TENANT_PHOTO	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774724481/iris-plaza/documents/vrlvcms1okq2ujt9x8vt.jpg	tenant-live-photo.jpg	56454	image/jpeg	SUBMITTED	\N	\N	\N	2026-03-28 19:01:26.902	\N	2026-03-28 19:01:26.902	\N
agreement-86d583eb-47d8-4689-8d6e-358a0c57b583	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	86d583eb-47d8-4689-8d6e-358a0c57b583	Rental Agreement	AGREEMENT	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1774724629/iris-plaza/agreement/agreement_86d583eb-47d8-4689-8d6e-358a0c57b583.docx	agreement_86d583eb-47d8-4689-8d6e-358a0c57b583.docx	\N	\N	SUBMITTED	\N	\N	\N	2026-03-28 19:03:54.602	\N	2026-03-28 19:03:54.602	\N
3e3b7df6-81ec-4f84-bcd0-44f06817eb8b	e558c5f6-72a9-416b-b80b-e8b4fa242e75	4fe88d06-e296-47dc-822d-e6db0206740b	AADHAAR	COLLEGE_ID	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774858937/iris-plaza/documents/ytbwwmrappxdovebjdum.jpg	dental1.jpg	25760	image/jpeg	SUBMITTED	\N	\N	\N	2026-03-30 08:22:19.129	\N	2026-03-30 08:22:19.129	\N
19a064e2-873f-4633-9069-314126df794e	e558c5f6-72a9-416b-b80b-e8b4fa242e75	4fe88d06-e296-47dc-822d-e6db0206740b	TENANT_PHOTO	TENANT_PHOTO	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774858940/iris-plaza/documents/i04rvqjfnjixxvmync7u.jpg	tenant-live-photo.jpg	30952	image/jpeg	SUBMITTED	\N	\N	\N	2026-03-30 08:22:21.055	\N	2026-03-30 08:22:21.055	\N
0873786f-26d2-4eb1-b162-df8466984890	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	3fe6a14f-0145-4ddf-b55e-64169a7a3bd2	AADHAAR	COLLEGE_ID	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775059511/iris-plaza/documents/ryqp5lq7xct19bujzkfb.jpg	PIC.jpeg	77209	image/jpeg	SUBMITTED	\N	\N	\N	2026-04-01 16:05:17.501	\N	2026-04-01 16:05:17.501	\N
9d6d64be-476a-434a-8827-e128bea58ac6	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	3fe6a14f-0145-4ddf-b55e-64169a7a3bd2	TENANT_PHOTO	TENANT_PHOTO	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775059513/iris-plaza/documents/tmauufpwqkm4t1zpyvju.jpg	tenant-live-photo.jpg	33539	image/jpeg	SUBMITTED	\N	\N	\N	2026-04-01 16:05:19.177	\N	2026-04-01 16:05:19.177	\N
b779af9f-2ab7-4a64-88a9-033aa0a7bda4	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	ee403659-33fb-4738-8f71-aa8a30b5308f	AADHAAR	COLLEGE_ID	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775211659/iris-plaza/documents/gpccaeedw17fw7bowezy.jpg	adhaar.jpeg	84089	image/jpeg	SUBMITTED	\N	\N	\N	2026-04-03 10:21:05.657	\N	2026-04-03 10:21:05.657	\N
e9c770a6-83cd-4841-87f3-eb0d4b349ad0	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	ee403659-33fb-4738-8f71-aa8a30b5308f	TENANT_PHOTO	TENANT_PHOTO	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775211660/iris-plaza/documents/uvixzguhw5jequmzebm4.jpg	tenant-live-photo.jpg	57689	image/jpeg	SUBMITTED	\N	\N	\N	2026-04-03 10:21:07.11	\N	2026-04-03 10:21:07.11	\N
agreement-ee403659-33fb-4738-8f71-aa8a30b5308f	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	ee403659-33fb-4738-8f71-aa8a30b5308f	Rental Agreement	AGREEMENT	https://res.cloudinary.com/dtcp8qhoy/raw/upload/v1775211691/iris-plaza/agreement/agreement_ee403659-33fb-4738-8f71-aa8a30b5308f.docx	agreement_ee403659-33fb-4738-8f71-aa8a30b5308f.docx	\N	\N	SUBMITTED	\N	\N	\N	2026-04-03 10:21:37.294	\N	2026-04-03 10:21:37.294	\N
\.


--
-- Data for Name: extension_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.extension_requests (id, "bookingId", "tenantId", "currentCheckoutDate", "requestedCheckoutDate", reason, status, "approvedAt", "approvedBy", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: maintenance_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_tickets (id, "tenantId", "bookingId", title, description, category, "requestedAmount", priority, status, "resolvedAt", resolution, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", type, title, message, "isRead", metadata, "createdAt", "readAt") FROM stdin;
9353a4b4-4023-40c8-844c-7f5c21860d64	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	PUSH	Booking Approved	Your booking has been approved by the admin. Your room is now ready for move-in.	t	\N	2026-03-28 19:03:47.748	2026-03-28 19:11:14.516
2f9808ae-d2cc-42a3-9966-bf98e4d6b130	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	PUSH	Rental Agreement Ready	Your rental agreement is ready for signature. Please sign it from your Documents page.	t	\N	2026-03-28 19:03:55.219	2026-03-28 19:11:14.516
962cd005-0455-4b99-9127-bd226ef6f9b2	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	PUSH	Rental Agreement Generated	Your rental agreement has been generated. You can download it from the Documents section.	t	\N	2026-03-28 19:03:55.529	2026-03-28 19:11:14.516
10ada74b-dbd0-4d56-879f-10ac345b89ed	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	New booking request	New booking request received for room Room 406.	t	\N	2026-03-30 08:22:13.049	2026-03-30 08:34:43.597
3ccd9424-b89b-4aa5-9a32-01b41160dace	e558c5f6-72a9-416b-b80b-e8b4fa242e75	PUSH	Booking Rejected	Your booking request was rejected.	f	\N	2026-03-30 08:39:40.613	\N
1f2af00c-20b3-49f0-993d-66c99633af81	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	New booking request	New booking request received for room Room 115.	t	\N	2026-03-24 12:08:03.488	2026-03-24 12:08:53.422
d131aa1b-90fb-42bc-8762-849415fc38ba	048db42a-dbee-4682-bc13-5b1f0212eaa0	PUSH	Booking Approved	Your booking has been approved by the admin. Your room is now ready for move-in.	f	\N	2026-03-24 12:09:45.787	\N
66fbed77-11d4-4e7e-8d6b-805d72314c8a	048db42a-dbee-4682-bc13-5b1f0212eaa0	PUSH	Rental Agreement Ready	Your rental agreement is ready for signature. Please sign it from your Documents page.	f	\N	2026-03-24 12:09:56.13	\N
4eb01369-d03a-45aa-a10d-0e9862b3b9d9	048db42a-dbee-4682-bc13-5b1f0212eaa0	PUSH	Rental Agreement Generated	Your rental agreement has been generated. You can download it from the Documents section.	f	\N	2026-03-24 12:09:56.948	\N
60388fed-2c08-4e90-86de-f8df194a6ca1	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	New booking request	New booking request received for room dilux.	t	\N	2026-03-28 19:01:11.273	2026-03-28 19:03:21.893
6f505546-9fc9-44a6-8260-f9d7b7e7fc88	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	New booking request	New booking request received for room Room 502.	t	\N	2026-04-01 16:05:13.123	2026-04-01 16:05:22.22
ffe5598a-8f29-4b59-babc-690ca579b2f0	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	Booking Rejected	Your booking request was rejected.	t	\N	2026-04-01 16:05:38.186	2026-04-01 16:05:58.881
6810a13e-4254-4d4a-880f-9d08e5c3bbe5	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	New booking request	New booking request received for room DILUX.	t	\N	2026-04-03 10:21:02.166	2026-04-03 10:25:23.312
28f92607-3b39-4d1a-a22f-3b14d346890b	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	Booking Approved	Your booking has been approved by the admin. Your room is now ready for move-in.	t	\N	2026-04-03 10:21:34.64	2026-04-03 10:25:23.312
8635fe58-ba20-4765-af1e-c6f44cad031e	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	Rental Agreement Ready	Your rental agreement is ready for signature. Please sign it from your Documents page.	t	\N	2026-04-03 10:21:37.298	2026-04-03 10:25:23.312
ffed8451-f52f-4afc-9c64-fba1321c01fd	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	PUSH	Rental Agreement Generated	Your rental agreement has been generated. You can download it from the Documents section.	t	\N	2026-04-03 10:21:37.3	2026-04-03 10:25:23.312
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otps (id, phone, "hashedOtp", "expiresAt", "attemptsCount", "isVerified", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, "userId", "tenantId", "roomId", "bookingId", "rentCycleId", "invoiceId", amount, "rentAmount", "paidAmount", "pendingAmount", "amountPaid", "borrowedAmount", "remainingAmount", month, type, status, "paymentMethod", "screenshotUrl", "transactionId", "transactionDate", "paymentDate", gateway, "gatewayOrderId", "gatewayPaymentId", "gatewaySignature", description, "invoiceUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, token, "expiresAt", "userId", "createdAt") FROM stdin;
bb0cf518-fc2a-47e3-811b-6199b48eca04	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5MjM3OTcsImV4cCI6MTc3NDUyODU5N30.zUCEwszgrqxkgiJshCefTN49B-SPV6kGmryINj63b6g	2026-03-26 12:36:37.014	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 12:36:37.016
77c90663-a79e-4e1c-9daf-4379b7f80354	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5MjUwMjksImV4cCI6MTc3NDUyOTgyOX0.h4X61yzp_JAqTvieH1ZzSknmZrfnMkaViyqpAOwokvY	2026-03-26 12:57:09.591	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 12:57:09.592
d8728ac7-acae-4638-8add-c1fb5ca8553b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5Mjk1ODgsImV4cCI6MTc3NDUzNDM4OH0.ASTIkxUw5RESR42ceXNv-fveBsvFfW8LiYZfKOdSsXQ	2026-03-26 14:13:08.07	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 14:13:08.071
aae6e26f-9c4a-454e-b718-ec11c30945b1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTE4NTcsImV4cCI6MTc3NDU1NjY1N30.OVO02azyLSJ2FllxMsRMdCi89Gf8R2DOsVPjvefRKN8	2026-03-26 20:24:17.83	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 20:24:17.832
8bad26e9-0c9e-41a7-a5fb-f92ac286f70e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTM0MTIsImV4cCI6MTc3NDU1ODIxMn0.Dj1XeuxQpzGuxwvQTEp-RWw_ItjIU6zSryjiNrhrcCY	2026-03-26 20:50:12.039	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 20:50:12.04
3131a4c8-d3f0-4dea-a52d-d7a473ac13f8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk5OTk5OTk5OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTQ1NzcsImV4cCI6MTc3NDU1OTM3N30.Mnw_V-Ci29lOpmWmlAvLHab66dcx-AvMTLUY3Ie9j6M	2026-03-26 21:09:37.508	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 21:09:37.509
d239163f-592d-43d6-94f6-a53f0e3d8779	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTQ5MTEsImV4cCI6MTc3NDU1OTcxMX0.mtt5gJQnLVFQ9VtxHOuhdfFqwfofbLzuPX1kpcarhcs	2026-03-26 21:15:11.242	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 21:15:11.244
e86d14bc-9150-4ba9-b6ad-cc08d768cba6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTU5OTEsImV4cCI6MTc3NDU2MDc5MX0.edQxbp-3fcRi-mM7V2G7Rw31oCG-Zn9EXOij9Ruebms	2026-03-26 21:33:11.775	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 21:33:11.776
ed4d2e7a-6ede-4ad2-ae8a-807844a9d3d9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTY5MTEsImV4cCI6MTc3NDU2MTcxMX0.FI0jNzH9p6-ziYtgwCMItAc_PLhJh0le6yLM1pNAVQs	2026-03-26 21:48:31.966	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 21:48:31.968
f57174bf-a4bb-4a16-a52d-f5c0db6ee756	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTc5MzAsImV4cCI6MTc3NDU2MjczMH0.N6eqAYusWAlU5IAeMqtLBWfkBIbcZU_ytf7OpELprpU	2026-03-26 22:05:30.99	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 22:05:30.992
3a15d79f-245b-4cef-8a40-df38325b5ebb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzM5NTkzODgsImV4cCI6MTc3NDU2NDE4OH0.V2aS7GXdfYc15_LfWz_sf0ewaO7t1LEULZ6CM6AUUJw	2026-03-26 22:29:48.971	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-19 22:29:48.972
831e9a52-790c-4685-857f-b5d368bf0d7b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YjgwMTZlMC1lMDM4LTQ5ZmMtYTI4Zi0wODlhN2RhNzAwYzIiLCJwaG9uZSI6Ijk4NDQwNjI1NzUiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzczOTc3MzE4LCJleHAiOjE3NzQ1ODIxMTh9.GoItSsn1I2RJw_Hf8t3HczWSArowZTz2PUqbBXnmr7Q	2026-03-27 03:28:38.762	7b8016e0-e038-49fc-a28f-089a7da700c2	2026-03-20 03:28:38.763
7245c819-e6a3-4181-aa49-b405af23f697	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YjgwMTZlMC1lMDM4LTQ5ZmMtYTI4Zi0wODlhN2RhNzAwYzIiLCJwaG9uZSI6Ijk4NDQwNjI1NzUiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzczOTc3MzI5LCJleHAiOjE3NzQ1ODIxMjl9.hOlcN0AGIdPcTwCEeGfJUKxLsSjX5F4fNoBQUesqP0s	2026-03-27 03:28:49.763	7b8016e0-e038-49fc-a28f-089a7da700c2	2026-03-20 03:28:49.764
30bd6b06-66d4-470b-966b-4ae3f73851aa	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQwNzkyMjcsImV4cCI6MTc3NDY4NDAyN30._Ys66L6Cu9j4t-pINuOueHa3q5c-zv0CmOJOSy7rJQ0	2026-03-28 07:47:07.365	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-21 07:47:07.453
4e63920a-e376-4832-ac54-2d965b3269db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQwODAzNTMsImV4cCI6MTc3NDY4NTE1M30.DZvT1-wjkhX9dAEcPhSyOFhIgXVntOfA-zEnAcEkehU	2026-03-28 08:05:53.466	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-21 08:05:53.552
de8f884d-d8bb-4999-9065-4be8db263fec	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQxNjYyOTAsImV4cCI6MTc3NDc3MTA5MH0.kA2gyl7r12zGwHRLtY9cYeEqfGfb2cnPXXbiOmLR0iM	2026-03-29 07:58:10.29	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-22 07:58:10.291
e2c85920-801d-4e88-9e0b-f1e7ee0ca514	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyNTg2MzEsImV4cCI6MTc3NDg2MzQzMX0.s-CsfziJLo8LJRrgPGoBAPdbQuXJy-mngjYlQWaBQAM	2026-03-30 09:37:11.283	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 09:37:11.285
e6c5efc1-4334-41eb-9016-b5114971fda3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyNzAyMjIsImV4cCI6MTc3NDg3NTAyMn0.UJxxyqjvBJamXEr8NiBq17mNuUXy5RDKcMq5RY37UWg	2026-03-30 12:50:22.989	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 12:50:22.991
8cb51645-6089-461a-bb67-dd7f3b9f103e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyNzE0MzEsImV4cCI6MTc3NDg3NjIzMX0.Mo7t7KKmONvBjKLET6dPqF8AR7NftnDF3DFnNxjFYsE	2026-03-30 13:10:31.931	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 13:10:31.932
a9c6d1f0-55cd-4b1c-8adf-ec8318c38d58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyODgzNzEsImV4cCI6MTc3NDg5MzE3MX0.HATWiLjIXJN0_UHgsY_8ye6EhOFDgid1UukEHWuT0RY	2026-03-30 17:52:51.685	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 17:52:51.686
d2568b66-b22f-453c-890a-06461f6182b1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyODk4MDQsImV4cCI6MTc3NDg5NDYwNH0.t0g8DGVSeblx3Sm6oBCMoLe5i7SxsvJIFZbZpBwMiAU	2026-03-30 18:16:44.787	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 18:16:44.788
666e5347-f3df-44e4-95cb-d460b964f6e1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTA4MzQsImV4cCI6MTc3NDg5NTYzNH0.dRLC8F_MpJ6I4VcWBMaZW-LtyhLQY3yiCcSWw-25XTg	2026-03-30 18:33:54.345	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 18:33:54.347
106b22d7-a02f-48c1-85e8-b187ce3fb3a2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTE4NjYsImV4cCI6MTc3NDg5NjY2Nn0.WHTvbZVLNwOWoOWGjlFr8DUBF49Wpi25FSfYXUB0QWA	2026-03-30 18:51:06.892	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 18:51:06.893
90338510-f0de-44d9-afc9-2eb3bdc0603f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTI3OTUsImV4cCI6MTc3NDg5NzU5NX0.w_F93SYHlgNQEoiNStv40ILiyfjYcXHUTBGrMlY_wCI	2026-03-30 19:06:35.335	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 19:06:35.337
109e08ad-12c2-4434-bf4c-1fd75d72d702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTQwMzgsImV4cCI6MTc3NDg5ODgzOH0.fbiWbFLD1nbqpY_2lAhe66CnMwY2v0g5fgwabLKsX3s	2026-03-30 19:27:18.526	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 19:27:18.527
e663ed86-6862-4089-98f7-235819ebabba	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTUyMTQsImV4cCI6MTc3NDkwMDAxNH0.tqB7fvfMKY6lyHiJJG3G-yIW_pspbJ9OxtilvHj3kJk	2026-03-30 19:46:54.021	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 19:46:54.023
400db36d-8315-414b-af78-929c672993f0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQyOTY0OTUsImV4cCI6MTc3NDkwMTI5NX0.ngrv2czg3wNhyNSOcTAdlK5f-IrZUxm_d7EayuL5T6c	2026-03-30 20:08:15.799	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-23 20:08:15.801
f00d405c-51dd-4196-8ae2-821a354ef1fb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMjQzNDUsImV4cCI6MTc3NDkyOTE0NX0.lzu4bHgO6Y9Kg2REd_QZ84ry7eHbaEwBcLnvYFtV2Tk	2026-03-31 03:52:25.841	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 03:52:25.842
040528e3-f7a6-4d97-9e05-5bf5a63a1315	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMjYyMjEsImV4cCI6MTc3NDkzMTAyMX0.EpIk9e9h3Si-9UtY4tmJYbUptzq7IBxBzTGVG0T4Zuw	2026-03-31 04:23:41.537	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 04:23:41.54
75e76e02-070f-4dde-b5fd-9fcee8dd28c5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMjc0MTMsImV4cCI6MTc3NDkzMjIxM30.GIkTOxWbxfxyvJQSjsBVhIF4fnzoDlgWdz_oh_ifIfE	2026-03-31 04:43:33.966	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 04:43:33.968
7ec8380e-e44b-4efa-bd2a-abe152cbeaf9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMjgzNjAsImV4cCI6MTc3NDkzMzE2MH0.-REqotXbmSyMoUeH8IG3m_jp2hEtSr2wN3SdWmNW4fg	2026-03-31 04:59:20.481	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 04:59:20.485
e9e466ab-dbfb-4978-a71a-109f8a2db784	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMzQ0MjgsImV4cCI6MTc3NDkzOTIyOH0.twn2HPAGk6MSt8EdwMT7XHWT0pNr70EFJsIBgz4Rseo	2026-03-31 06:40:28.97	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 06:40:28.972
f108aa0c-6839-4bda-9fa6-3e52d9568bec	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMzU4NDMsImV4cCI6MTc3NDk0MDY0M30.csWEJWXtYaNHeoFVCTNlxSkot52XTqCDfkv1eUBmXOM	2026-03-31 07:04:03.732	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 07:04:03.734
768f2fc0-ae18-41ac-b77c-5d65725341e0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMzY5ODksImV4cCI6MTc3NDk0MTc4OX0.Eb0OkkUIcJXMHPVECskzsYHGXkr3OJFnr4Dbb3cNFnA	2026-03-31 07:23:09.36	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 07:23:09.363
bb1d159e-7b58-4e0a-bade-adf457b5502f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzMzg5MTMsImV4cCI6MTc3NDk0MzcxM30.fU_wNO_-ppQuCLf2kG8UAwsM8Z1YK1DGuvebSwjvrFA	2026-03-31 07:55:13.361	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 07:55:13.364
c8cc9751-f1b3-434f-ac02-0a787134d4e5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDAwNjAsImV4cCI6MTc3NDk0NDg2MH0._hgd2og8_BYhiTNcenbf-rjpxScZPjEIGaE1iv2XUdQ	2026-03-31 08:14:20.449	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 08:14:20.451
4eb79d6f-92b8-430c-805c-5ae46532d1c2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDExMzgsImV4cCI6MTc3NDk0NTkzOH0.2vsOb1tGHMYzvR3y0WiiJt9dTVSAIr_yDP2egfuvgRU	2026-03-31 08:32:18.74	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 08:32:18.741
486a0fed-2eb3-47e8-86f8-49b6983f9571	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYzM5NjUyMS1jZDIxLTRlNzgtYTk2Ny0wMzRmOWVkY2ExMTgiLCJwaG9uZSI6IjkwMDAwMDE0NTIiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0MzQxOTkwLCJleHAiOjE3NzQ5NDY3OTB9.3xPSxrtnYNjok4BN2nAx2MUZbGA8-7qrUQQGUJaMD-k	2026-03-31 08:46:30.5	ec396521-cd21-4e78-a967-034f9edca118	2026-03-24 08:46:30.502
b201117d-e71b-4bfa-aa6d-030e10e6106e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYzM5NjUyMS1jZDIxLTRlNzgtYTk2Ny0wMzRmOWVkY2ExMTgiLCJwaG9uZSI6IjkwMDAwMDE0NTIiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0MzQyMDA1LCJleHAiOjE3NzQ5NDY4MDV9.hypwomcQy9HgjK6jBmRu7XyemifghycbeH5IZe1dF9o	2026-03-31 08:46:45.153	ec396521-cd21-4e78-a967-034f9edca118	2026-03-24 08:46:45.154
680afc8b-edaa-424f-b792-8b217d182066	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDIxNjEsImV4cCI6MTc3NDk0Njk2MX0.FbzrqFfZwYiBQ5Y3u-3APaD2k7dCIEJjuWXFLJrHlcw	2026-03-31 08:49:21.407	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 08:49:21.409
edf6ff2b-a9ce-4935-b6c6-255ad3c61eab	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYzM5NjUyMS1jZDIxLTRlNzgtYTk2Ny0wMzRmOWVkY2ExMTgiLCJwaG9uZSI6IjkwMDAwMDE0NTIiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0MzQyMjAyLCJleHAiOjE3NzQ5NDcwMDJ9.HfTvoSMWtAK8pMeLCNCFW_ZbEgwn4khBRD-2zoaYsRo	2026-03-31 08:50:02.733	ec396521-cd21-4e78-a967-034f9edca118	2026-03-24 08:50:02.734
1528e811-e242-48f6-ab2b-3cda1cc384ad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDI4MTAsImV4cCI6MTc3NDk0NzYxMH0.Poni6tb-H4jPmHCDv2oSWWXQeNRq736NxlXDoztMz7s	2026-03-31 09:00:10.396	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 09:00:10.398
cb0afe1c-82c3-4fce-90a9-12f27d3dbf23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDQwOTIsImV4cCI6MTc3NDk0ODg5Mn0.elTHoG8mnOWdPD05AuA1Tk-nSVP4pSg_vAKKPAzYx3M	2026-03-31 09:21:32.702	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 09:21:32.705
fa6f6bf5-1c58-4710-9a5f-3be0719a4a23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNDUwNTgsImV4cCI6MTc3NDk0OTg1OH0.ZKMRwdiAts_HHLvarpaHmgNaPzt5c0KfrFF6A_eTLnE	2026-03-31 09:37:38.491	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 09:37:38.493
3ca2ac74-b4b0-4cc8-8464-3f5231718c39	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTM0NTgsImV4cCI6MTc3NDk1ODI1OH0.fK8T9oc3zNHf1ZcsYZOMhFqthV3Tm-yYLBp9AM3ZeC4	2026-03-31 11:57:38.841	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 11:57:38.843
e5fc242c-9248-49a0-a1aa-4c962e326a17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNDhkYjQyYS1kYmVlLTQ2ODItYmMxMy01YjFmMDIxMmVhYTAiLCJwaG9uZSI6Ijk3MzkzOTY1OTAiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0MzU0MDEyLCJleHAiOjE3NzQ5NTg4MTJ9.BBMLLXxV6yEdw2xFYVr5hsqSCTgJNpjkJgtgHejgptE	2026-03-31 12:06:52.333	048db42a-dbee-4682-bc13-5b1f0212eaa0	2026-03-24 12:06:52.335
3f97d2e8-c91d-41ae-be60-5b09ad21749e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNDhkYjQyYS1kYmVlLTQ2ODItYmMxMy01YjFmMDIxMmVhYTAiLCJwaG9uZSI6Ijk3MzkzOTY1OTAiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0MzU0MDIxLCJleHAiOjE3NzQ5NTg4MjF9.Z9Cqa744YCM3eJ34_oFLYVY7U5Ksh5sRcdHoYaXK6BI	2026-03-31 12:07:01.196	048db42a-dbee-4682-bc13-5b1f0212eaa0	2026-03-24 12:07:01.198
ca6b4cc3-a433-40c2-b6bb-ab972fde2a91	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTQxMjYsImV4cCI6MTc3NDk1ODkyNn0.8Agcv4FrK7rp3WOC96EQgY5WcrYAmzf22bdX6NLNLwc	2026-03-31 12:08:46.261	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 12:08:46.263
403009c6-8c70-4581-993d-3b331776dec9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTQyMDEsImV4cCI6MTc3NDk1OTAwMX0.dLA1dbpfuMuvJImu9QxhHn2jr_8ZRvqVmdj-TZ0Jr3E	2026-03-31 12:10:01.111	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 12:10:01.113
a8075539-f0f1-4536-a28a-e9ed690b65b8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTU2NjksImV4cCI6MTc3NDk2MDQ2OX0.dVb5eAB5fwkZtO5GQkVKUEAY_ZbSkspbzZ8lw5oH_dM	2026-03-31 12:34:29.613	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 12:34:29.615
be882440-9644-4c80-b344-9a54d32d916b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTY4NTcsImV4cCI6MTc3NDk2MTY1N30.WMakcae121ARBGWe7nZzzH-CubHbJRjH40Xiev4TJYs	2026-03-31 12:54:17.081	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 12:54:17.083
8db3026e-8675-4fd9-a748-60fe9d3d4ed6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Ijk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNTgyNjAsImV4cCI6MTc3NDk2MzA2MH0.2u3QFi-4rFZRle1Aq4LRY_Zkzle5bZgWpbJEUDz4ZsE	2026-03-31 13:17:40.669	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 13:17:40.671
c870248f-5f51-4880-abc1-262e90b672c8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNjI5MzgsImV4cCI6MTc3NDk2NzczOH0.XF0d6n66CmQzpVONTDamfoeQxRXA-yHcX8iilY0ewNA	2026-03-31 14:35:38.839	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 14:35:38.841
cc43d67c-b32c-4041-864e-998c722f2569	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNjQwOTgsImV4cCI6MTc3NDk2ODg5OH0.oFRIX66S8GxrwC75GOtExKxhYQax3IfsvaF1doQjdzU	2026-03-31 14:54:58.03	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 14:54:58.032
b7e61bd1-b8e2-48f6-897d-73b18e6b3582	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNjU2MTMsImV4cCI6MTc3NDk3MDQxM30.bbcUp10iBwmVXUKqKpYv2hmNKiy01TJYHUjXBjP4vGA	2026-03-31 15:20:13.691	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 15:20:13.692
bfdf2651-6418-452d-8bfc-c9cface2c95d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQzNzkwNjcsImV4cCI6MTc3NDk4Mzg2N30.62STqH3huMZTtmwlKW7B_IHiIfFm0I3QgSpozd9MP1Y	2026-03-31 19:04:27.07	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-24 19:04:27.071
16eb2e4f-0ccf-413d-9266-4440edffe12b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ0MjAyMjQsImV4cCI6MTc3NTAyNTAyNH0.SAaQbZebUcQrWx0sKQDPhLP8dA264L7y40abN9zSma4	2026-04-01 06:30:24.304	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-25 06:30:24.305
fdcfc60a-3e00-423a-af91-d94c26fc95f0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ0NDk4NDEsImV4cCI6MTc3NTA1NDY0MX0.pzOn7lK1K9RkJgJdW5m399fZBZC51clwkZr1q9ApuE0	2026-04-01 14:44:01.498	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-25 14:44:01.499
17d49464-39c3-424b-8fac-8c5eb51ac035	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNDBkMzBiZS00NDM2LTRkNTYtODE3OS02NDdmMzg1MTIzZDAiLCJwaG9uZSI6IjYzNjY3MzI2OTkiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NDUwMDA3LCJleHAiOjE3NzUwNTQ4MDd9.vf2PXPcEHxnLFsxbTzNYH2AoWVtzRBhja8rvv7FWbkw	2026-04-01 14:46:47.368	a40d30be-4436-4d56-8179-647f385123d0	2026-03-25 14:46:47.369
d56072dc-78fb-41f9-ac09-cd6374d01df1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNDBkMzBiZS00NDM2LTRkNTYtODE3OS02NDdmMzg1MTIzZDAiLCJwaG9uZSI6IjYzNjY3MzI2OTkiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NDUwMDExLCJleHAiOjE3NzUwNTQ4MTF9.ufuxOfdeW6tRnxIXSLM1A-gPsSzFsq_wdtqcl9ceORU	2026-04-01 14:46:51.343	a40d30be-4436-4d56-8179-647f385123d0	2026-03-25 14:46:51.344
dfdf6465-39b3-467d-9cee-a1818bff4852	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ1ODY3MjcsImV4cCI6MTc3NTE5MTUyN30.6Z-r1C0lRjGcfL7dtTz4O67qjb0oNs3retniCpCYSPw	2026-04-03 04:45:27.206	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 04:45:27.207
00170f27-707a-41ee-885b-f34e9c349c31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ1ODcxMjYsImV4cCI6MTc3NTE5MTkyNn0.o8ZOdlPnQ3XUVeRrAziD8DypdfIrnxwOMUzH4IjlD2Y	2026-04-03 04:52:06.584	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 04:52:06.585
0992202c-2cfc-4e70-8935-f56ff19f5f08	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ1ODc4MTEsImV4cCI6MTc3NTE5MjYxMX0.021a_UslaZI8QH_JxfoeexxzqOjZpbc-pkDzxelgDLE	2026-04-03 05:03:31.18	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 05:03:31.181
acdc6128-9383-4d64-8af1-57091892be17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ1OTk2ODEsImV4cCI6MTc3NTIwNDQ4MX0.XaZ7wmjtu0bn-Y7DV6ovQFHfeW9oCQXfiyDI5sNxvAo	2026-04-03 08:21:21.398	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 08:21:21.4
0ccabbae-d6ce-47db-8d53-0beaabbdf63d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ1OTk3MzgsImV4cCI6MTc3NTIwNDUzOH0.lDM4mq_rsKeM4Q2QDY1PhD1fYE2PKXR4fEdnJCSLMng	2026-04-03 08:22:18.23	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 08:22:18.231
15d82dc0-ce26-4dad-b283-4d665cf22578	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2MDAxNzcsImV4cCI6MTc3NTIwNDk3N30.8ffFNaCE5DdIb_I1uUgxUpVqhR_NimxthjPYjtQzL_Y	2026-04-03 08:29:37.81	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 08:29:37.811
cce3f118-e93a-4c88-bd85-c940ec8e47d3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2MTYwODIsImV4cCI6MTc3NTIyMDg4Mn0._ICZHG4v3eXAgaTFL6mn_K-b1vPTrNJU9SITESAIQt8	2026-04-03 12:54:42.247	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 12:54:42.249
4eac608b-8482-48fe-811d-9fad2597ec23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2MTcxNTIsImV4cCI6MTc3NTIyMTk1Mn0.wrGQ9-PnT-3bECfF-ZlKvIkJVjDSb_v7G4Ysk5lJ7e0	2026-04-03 13:12:32.161	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 13:12:32.163
0257e768-65b4-4980-8df6-777e8103c055	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2Mzk5NzEsImV4cCI6MTc3NTI0NDc3MX0.6oy80pa9IZLTKd2KvlkfiqVB0h-NtP68USt_FFfT_Hw	2026-04-03 19:32:51.348	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 19:32:51.353
36343810-bce1-4ffc-ad13-f4e8a7f158d1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2NDA1NjUsImV4cCI6MTc3NTI0NTM2NX0.hz10S6G9aswgUwpZ0yI55EJKlSqRZVisdh8WCUGJ8B4	2026-04-03 19:42:45.473	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 19:42:45.475
803413db-a30c-47c5-9dcb-d3136565a129	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2NDE0ODMsImV4cCI6MTc3NTI0NjI4M30.hikzkrUAFhq8aVnE4luu00XWX3ecerMoBzqPU71qlF0	2026-04-03 19:58:03.985	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 19:58:03.986
967df603-7eaf-46b4-b4d1-f3364b00504e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NjQxNTgwLCJleHAiOjE3NzUyNDYzODB9.aEe-vrI1XTNV7W_8TMLVF8F0WL6EASmTlAVa8q__wt4	2026-04-03 19:59:40.84	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-27 19:59:40.841
e096f1ab-aa8d-4375-9d01-d5d55f4e599b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NjQxNTg3LCJleHAiOjE3NzUyNDYzODd9.yIvhxQbrUGi1RM3WHWnAPQb9kHIvp1pEJeoHS8ecXy4	2026-04-03 19:59:47.53	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-27 19:59:47.532
a3b0585a-da3f-4fcb-8a58-4150cf42c7a7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ2NDE2MTIsImV4cCI6MTc3NTI0NjQxMn0.lEhr9P4Ppm18UFuKn8j0bTcTWxKWE_Ku0kXriQtzqd0	2026-04-03 20:00:12.174	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-27 20:00:12.176
caef95d5-92b8-47f6-b93d-77c55dd6b081	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MDExNzIsImV4cCI6MTc3NTMwNTk3Mn0.6Avl3_Fev2jRW6ldmU8hKT6iIqY-xs2Ls2mLOcxH03Q	2026-04-04 12:32:52.908	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 12:32:52.912
8613ab54-22f9-4493-bdd7-d03a1dcbdfe5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MDIwOTgsImV4cCI6MTc3NTMwNjg5OH0.SJ7IJRHfr9j2pJgX3pDyJBqd2tgBBlTWZQv11GafQg0	2026-04-04 12:48:18.628	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 12:48:18.631
89599034-5329-4513-8684-faf70d1a9888	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MDM4MDIsImV4cCI6MTc3NTMwODYwMn0.-UR4PyYHNXHY8exTXsIR-x72uQmg7bQv006KPyEMZRo	2026-04-04 13:16:42.624	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 13:16:42.629
947bb427-c927-4288-bae5-d7be304255be	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MDk1NzMsImV4cCI6MTc3NTMxNDM3M30.4qSd9boCRlYHMl61ykDIbSwizta0cgqjKh9RcwNUwWA	2026-04-04 14:52:53.009	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 14:52:53.012
1f9dd2b1-e7dd-4837-8f15-e47bcb0e3bc3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MTA1MTMsImV4cCI6MTc3NTMxNTMxM30.a8aTh5cft4fZqLZAHiV9tmNYA4N6psZcDMjjFfsxnK4	2026-04-04 15:08:33.69	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 15:08:33.692
d3d31bc5-fad6-4c9b-b3c3-c3c7014707dd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NzEwNTQzLCJleHAiOjE3NzUzMTUzNDN9.EFOp-2HaBCPLt4B4PXWbR-vTlHF0CbdXkNumGuGGse0	2026-04-04 15:09:03.383	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-28 15:09:03.385
00a55954-74ee-4c41-b128-c2c93dcf7577	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NzI0NDIxLCJleHAiOjE3NzUzMjkyMjF9.DsWqw0nfZTC4Bk95_hW9_8Tl-ccYOEziicqwoSxzp-I	2026-04-04 19:00:21.41	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-28 19:00:21.412
ca7a9a34-1cfc-4cb9-91ed-ee85cba9d57d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MjQ1NDQsImV4cCI6MTc3NTMyOTM0NH0.OpwYT5hhH5IWt0_Cky_MnKsBhA6qTPH5joKIBDCz4ZM	2026-04-04 19:02:24.712	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 19:02:24.714
6fea6676-647a-4de4-b9ab-84026a06d958	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0NzI1MDY5LCJleHAiOjE3NzUzMjk4Njl9.MZYX7doCf5jf1CNXy-peGC4kxu-1zf1IfzX5jLpFW78	2026-04-04 19:11:09.2	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-28 19:11:09.201
c8637d2f-82b0-4bbb-b6c8-df981ad253dc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ3MjU0MjEsImV4cCI6MTc3NTMzMDIyMX0.-OXjFWQuGSoZcVlMP_EJwFI2wanH5nLdE_qXVUJp-BU	2026-04-04 19:17:01.811	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-28 19:17:01.812
e50c1570-e8eb-4b2e-92eb-4b4d7e25e450	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4MDc5MDIsImV4cCI6MTc3NTQxMjcwMn0.snXzM0insfpsEKfzhMdf0CPKMsv7GiiQJLxGUz-nx1k	2026-04-05 18:11:42.039	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-29 18:11:42.04
43872a9f-b6d8-4b3f-9ff4-5b1d00fc026f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NDU2NzMsImV4cCI6MTc3NTQ1MDQ3M30.PqrXqKqRP5xxoVZ1kCckDJqz_PwWO96rfpH_xTTlqnw	2026-04-06 04:41:13.547	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 04:41:13.548
b809448f-35b6-4481-ae24-c55f9c71dc10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0ODQ2Nzc0LCJleHAiOjE3NzU0NTE1NzR9.VK_13Dh5ZM0eWA3utd7cWpZezX4s0OAnKag3RlIhZT8	2026-04-06 04:59:34.823	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-30 04:59:34.827
9d2226e8-fd5e-463b-9adb-d456ff8840a0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOGU1ZDRjNS05YWU0LTQ0Y2MtYjJhZS1jNzU1Njk2NWIxNWIiLCJwaG9uZSI6Ijk2MDY2NTI1MDEiLCJyb2xlIjoiVEVOQU5UIiwiaWF0IjoxNzc0ODQ2ODM4LCJleHAiOjE3NzU0NTE2Mzh9.4pDsi0KQhkPqgy2ZuMNfMFwQcKdV6psCvacXRELMmDw	2026-04-06 05:00:38.017	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2026-03-30 05:00:38.019
318d6fb9-58ec-4546-b235-9400071e503f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTE5MzIsImV4cCI6MTc3NTQ1NjczMn0.tB51G6ZPCpQFQdtsL-82rXS_DetCz7Kx7f4ZoGECIRQ	2026-04-06 06:25:32.495	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 06:25:32.496
aa045acf-6924-4efc-9133-d06bd34b031c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTI4ODEsImV4cCI6MTc3NTQ1NzY4MX0.3Y3z5gosfU5hfg4dHLfTaZQ0v4vhKBRduL61BphOdpI	2026-04-06 06:41:21.481	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 06:41:21.482
e1044ee8-7fbe-4a81-b26e-eb0f4b300877	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTM3OTQsImV4cCI6MTc3NTQ1ODU5NH0.X5MaNei2hGyw_OI0UCNfX8yFVsQvOD9-vHuT3ePxI5s	2026-04-06 06:56:34.404	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 06:56:34.406
00127f17-326a-4a20-bcb5-f96b04e31b8d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTQ3MzksImV4cCI6MTc3NTQ1OTUzOX0.5VTVjs43OVYxUyaQbIlfr3YCiWUumiPuaynX_k57Q5A	2026-04-06 07:12:19.262	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 07:12:19.263
5fcc1180-6061-4c97-910c-1c8b2c93e304	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTQ5MjksImV4cCI6MTc3NTQ1OTcyOX0.3sAXvfzh6sK4bfobaYIZu5nS8S4cvkUb8Etf8h8OcZg	2026-04-06 07:15:29.063	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 07:15:29.064
05b708e4-d02b-48eb-afa3-cc6b3627ccf6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTQ5NzAsImV4cCI6MTc3NTQ1OTc3MH0.6jzU_7pVg2SQAmWEns3Dto6w0pcVK20Rvui6GA3uH7k	2026-04-06 07:16:10.778	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 07:16:10.779
6930885a-9ce0-4b42-9977-aa2146a81c1f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTc3MjIsImV4cCI6MTc3NTQ2MjUyMn0.pKWxoSDeahmHtRMbVJtOtimdYkYO2jtgSMPCGRM2k4U	2026-04-06 08:02:02.936	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 08:02:02.937
6ba7df12-ccc8-4d09-9228-88d7bc1ed63c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTU4YzVmNi03MmE5LTQxNmItYjgwYi1lOGI0ZmEyNDJlNzUiLCJwaG9uZSI6IjE0MTRtaXNoYWxAZ21haWwuY29tIiwicm9sZSI6IlRFTkFOVCIsImlhdCI6MTc3NDg1ODc5OCwiZXhwIjoxNzc1NDYzNTk4fQ.8F4Rk6nkYWTFDoIGtHIulUegCfkKEK-yYcgDGkdZKeg	2026-04-06 08:19:58.557	e558c5f6-72a9-416b-b80b-e8b4fa242e75	2026-03-30 08:19:58.558
82a3f74c-4fee-4d0b-a85e-14674526a00d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTU4YzVmNi03MmE5LTQxNmItYjgwYi1lOGI0ZmEyNDJlNzUiLCJwaG9uZSI6IjE0MTRtaXNoYWxAZ21haWwuY29tIiwicm9sZSI6IlRFTkFOVCIsImlhdCI6MTc3NDg1ODgxNSwiZXhwIjoxNzc1NDYzNjE1fQ.FWjircHB5L2s1_Qt0PiT5VyqXXd6Pxn71sfdLxd1Qeo	2026-04-06 08:20:15.13	e558c5f6-72a9-416b-b80b-e8b4fa242e75	2026-03-30 08:20:15.131
1bfd4ff6-1f2e-4006-9c8f-8162b242361a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTg4OTQsImV4cCI6MTc3NTQ2MzY5NH0.hNwCBu_XQr2muGaddNX0F4HhesrM-Z3IbfyauyXi-ak	2026-04-06 08:21:34.977	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 08:21:34.977
336186a0-788d-4cfb-834a-26e875b6aa2b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTkyNzgsImV4cCI6MTc3NTQ2NDA3OH0.5Z7rEe95bODJMfVEkOGvc_ysNbFgie7S-34khFpMUJw	2026-04-06 08:27:58.081	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 08:27:58.082
df1854ee-b044-4234-8236-593781d8e8d2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzQ4NTk3OTAsImV4cCI6MTc3NTQ2NDU5MH0.Zd2AziB3BdKjX8gdoz0w-K_N6Zpk3aVcVtHFTWoJJqE	2026-04-06 08:36:30.71	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-03-30 08:36:30.711
bb39e1ec-bd53-4206-a2a0-3ea30bd43f17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUwNTk0NjQsImV4cCI6MTc3NTY2NDI2NH0.3x34lJzQ6i1rket8F9FZiqzAA9PeZTDKONl8yOcH-Yk	2026-04-08 16:04:24.97	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-01 16:04:24.972
dfe8856a-1c45-488a-86ac-2fd376301ae9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUwNjkwOTIsImV4cCI6MTc3NTY3Mzg5Mn0.CaPz9slthqTHSUeCyNFGg1RHah5f7hwgZW23s0ACpIQ	2026-04-08 18:44:52.97	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-01 18:44:52.973
f84aa624-fade-42a9-a972-44331cfa99b8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUwNzI1NjAsImV4cCI6MTc3NTY3NzM2MH0.hbYyulbDCQk8L0CRi5pCpjN5twWG_f74WR4dB7iq8h8	2026-04-08 19:42:40.038	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-01 19:42:40.041
87b52416-67c0-424b-91ec-ce29f26bcff1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUwNzM1MjAsImV4cCI6MTc3NTY3ODMyMH0.xY6VxGGo9cJnNZ1KiBAPcCOEcgAeDM650Knb1aRknOw	2026-04-08 19:58:40.096	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-01 19:58:40.098
6fd268ea-9cde-4588-89e9-097242a8d980	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUxNTI5MTUsImV4cCI6MTc3NTc1NzcxNX0.0UULW_JIQ-UKSaqFpCIcbK6eUWH8IKVcWJNWzrrOJwQ	2026-04-09 18:01:55.536	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-02 18:01:55.54
cdd86d2a-3340-43dc-bfd8-22a4243ff9e5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUxNTUwODcsImV4cCI6MTc3NTc1OTg4N30.oCc6BoLJENBINsIIU-napB961VwKtYkQ6n6Nr-WRVTo	2026-04-09 18:38:07.378	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-02 18:38:07.38
e35618d7-36fe-4c79-83c3-20d2c159c353	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUyMTExNjUsImV4cCI6MTc3NTgxNTk2NX0.OZQniNzi8sm0dm1mk4MdV6RxP4DO1c2ZVNr8sa6awBs	2026-04-10 10:12:45.504	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-03 10:12:45.507
7afbf03e-d17b-4d2c-8151-2780512d5ddb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUyMTIwNzcsImV4cCI6MTc3NTgxNjg3N30.M2eQcpIU-cV446uYAOp_wEOIPU9YTs_L7IJgt2nxRTE	2026-04-10 10:27:57.168	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-03 10:27:57.169
1f1d2d6a-3967-4d0c-b8b3-de7f4a9536c7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUyMTMzOTEsImV4cCI6MTc3NTgxODE5MX0.hLhPTN4bURaDR_ECt_QZgm6gtnuNF5mYvnnlN5FaZfE	2026-04-10 10:49:51.148	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-03 10:49:51.149
1319096a-2e3c-4d7f-ba18-7ea4093809af	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJhMjg2NC1mZjZkLTRlNDgtYWI4Mi03ZDQ5MTJiYjFiMDAiLCJwaG9uZSI6Iis5MTk4NDUxNTE4OTkiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzUyMTQzMTEsImV4cCI6MTc3NTgxOTExMX0.Y_nYjHlEBGYIynEyd1i65LlSDjHrc26A5RcDIBu3_xg	2026-04-10 11:05:11.222	66ba2864-ff6d-4e48-ab82-7d4912bb1b00	2026-04-03 11:05:11.224
\.


--
-- Data for Name: rent_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rent_cycles (id, "userId", "bookingId", month, year, amount, "dueDate", "paidDate", status, "lateFee", "lateFeeApplied", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: room_amenities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_amenities (id, "roomId", "amenityId") FROM stdin;
7bf646a0-722d-4d01-b5db-a23a69b307e1	febfdbc4-874a-459c-8309-6ee0f7b96a8e	2fdc9afc-9716-4685-9dbe-61fa7ee00463
a1a1d5b7-ea88-4b21-bd63-a09ddb1d1707	febfdbc4-874a-459c-8309-6ee0f7b96a8e	f72d4d9c-3000-406c-8cc1-be093dc1de57
0c98d18c-8289-4fa4-a221-4b32f27b277d	febfdbc4-874a-459c-8309-6ee0f7b96a8e	657480ca-7532-4af1-a318-da2913479a0e
c72e8c44-6063-4a5f-b481-ea30b52158dc	febfdbc4-874a-459c-8309-6ee0f7b96a8e	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
bae08242-a6f5-4246-bfce-91eafab19378	febfdbc4-874a-459c-8309-6ee0f7b96a8e	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
19282d34-0ff4-439a-bdac-8fffe3a080ba	febfdbc4-874a-459c-8309-6ee0f7b96a8e	a8dbd99e-f577-4d18-b146-861aeb1197ee
4b8ecb6f-4b39-4923-a249-7435f55ab85e	a95cd978-e8f5-4094-9601-1129fd48c178	26a9b4ca-f968-423b-ae26-c3d2e2692446
5c9ea538-1644-4882-b4cc-201506a81282	a95cd978-e8f5-4094-9601-1129fd48c178	a8dbd99e-f577-4d18-b146-861aeb1197ee
ac438a67-e784-4ef2-b8cd-370cc60bfb88	a95cd978-e8f5-4094-9601-1129fd48c178	072c8a4f-d84d-45fc-af2a-1f0186742e29
a2b50183-0f9e-4abf-a475-5a28c25b0690	a95cd978-e8f5-4094-9601-1129fd48c178	d22c4428-8508-4dd2-8f38-7ce189a5609f
80d495e0-72a5-49ec-9537-d3fcb5e6b092	a95cd978-e8f5-4094-9601-1129fd48c178	657480ca-7532-4af1-a318-da2913479a0e
d64152e6-a925-42e4-899b-e4e32d19f7e5	a95cd978-e8f5-4094-9601-1129fd48c178	f72d4d9c-3000-406c-8cc1-be093dc1de57
e143de5b-bb2f-43ef-b34d-36d41b804c68	a95cd978-e8f5-4094-9601-1129fd48c178	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1e9d4979-5ca1-440f-b19d-1d1f59ac6039	a95cd978-e8f5-4094-9601-1129fd48c178	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
e24bcecf-c13f-4964-8a9d-3fabcc2d1cad	febfdbc4-874a-459c-8309-6ee0f7b96a8e	7b1e23af-ba06-482e-a09b-41376eef3061
5e15fca0-e207-4057-bb72-7d990d118ffb	febfdbc4-874a-459c-8309-6ee0f7b96a8e	8aae2daa-5961-4663-a346-89df54ffc405
4de47a1c-2b92-4f5f-80ac-d30bb35e3d7a	febfdbc4-874a-459c-8309-6ee0f7b96a8e	072c8a4f-d84d-45fc-af2a-1f0186742e29
7b772bdd-5012-48b1-b667-9c51f3ffdb81	51ffddf7-dd3a-4f80-9096-5cfd709846e2	26a9b4ca-f968-423b-ae26-c3d2e2692446
f297dc11-cb36-4de9-bc82-f1ab4b26dd3d	51ffddf7-dd3a-4f80-9096-5cfd709846e2	7b1e23af-ba06-482e-a09b-41376eef3061
a6f74cc9-f569-43ab-b3d7-fc771ea981e4	51ffddf7-dd3a-4f80-9096-5cfd709846e2	d22c4428-8508-4dd2-8f38-7ce189a5609f
80d324f6-697a-4cae-9a8a-7c5feb237f47	51ffddf7-dd3a-4f80-9096-5cfd709846e2	657480ca-7532-4af1-a318-da2913479a0e
03bd5970-fdc8-4a2e-9a21-6d9774792e49	51ffddf7-dd3a-4f80-9096-5cfd709846e2	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
7a9017f1-7fa0-44cb-8538-5275022b4e1d	51ffddf7-dd3a-4f80-9096-5cfd709846e2	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
ccf0d798-8d30-4c0c-8e77-1dafbda8a63d	51ffddf7-dd3a-4f80-9096-5cfd709846e2	072c8a4f-d84d-45fc-af2a-1f0186742e29
8d073634-3263-48eb-8590-8e18953459ae	51ffddf7-dd3a-4f80-9096-5cfd709846e2	f72d4d9c-3000-406c-8cc1-be093dc1de57
8f95b9e4-a5b5-437c-9d99-92ac29401d3e	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	26a9b4ca-f968-423b-ae26-c3d2e2692446
fccfe387-4bcd-4572-8d90-bb23c5d94f46	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	a8dbd99e-f577-4d18-b146-861aeb1197ee
27fd9a6f-6cb9-4f0b-88d6-16887e7dbbd1	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	072c8a4f-d84d-45fc-af2a-1f0186742e29
9f066b7b-c274-4a08-b13a-f5b521a18b91	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	d22c4428-8508-4dd2-8f38-7ce189a5609f
6ad97467-3ea3-43b9-aa79-3bb92c2ebd13	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	657480ca-7532-4af1-a318-da2913479a0e
f20d2ee8-7cca-4bec-8a58-a12017c64865	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	f72d4d9c-3000-406c-8cc1-be093dc1de57
8909c4c0-98fe-45c6-8fb3-107a86eed7b4	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
87288407-4c44-404d-978a-1b932e77b40d	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
a36cc5bf-7c8f-4662-bff6-214a02e0ed3f	2253584c-f96c-49b8-8205-ad4d9742f135	26a9b4ca-f968-423b-ae26-c3d2e2692446
7f4229a1-cf46-4873-9073-97034fe06cb0	2253584c-f96c-49b8-8205-ad4d9742f135	f72d4d9c-3000-406c-8cc1-be093dc1de57
a38de188-ce3b-496a-8713-b193dd66f7dd	2253584c-f96c-49b8-8205-ad4d9742f135	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
a465ba3a-ea32-438b-a588-43622bd6a983	2253584c-f96c-49b8-8205-ad4d9742f135	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
dce4e85a-97af-434a-b16f-18c0f189b595	2253584c-f96c-49b8-8205-ad4d9742f135	d22c4428-8508-4dd2-8f38-7ce189a5609f
9c5b0858-286f-4708-ae72-49ec0486f33c	2253584c-f96c-49b8-8205-ad4d9742f135	657480ca-7532-4af1-a318-da2913479a0e
1143a9a0-7a23-4630-af4d-5a46ef8cee7a	2253584c-f96c-49b8-8205-ad4d9742f135	072c8a4f-d84d-45fc-af2a-1f0186742e29
86aa779e-0281-48d1-a3a7-fa50b70d5bdc	2253584c-f96c-49b8-8205-ad4d9742f135	a8dbd99e-f577-4d18-b146-861aeb1197ee
4c9cbd6c-ec78-4eab-9ae9-76c0dd70299a	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	26a9b4ca-f968-423b-ae26-c3d2e2692446
6ca9875c-d0a5-4a7b-9bf5-8f451ee1e798	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	072c8a4f-d84d-45fc-af2a-1f0186742e29
ecc10166-148b-48f7-9c54-cf628e622d25	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	f72d4d9c-3000-406c-8cc1-be093dc1de57
8da797c8-ab62-44d1-bd71-0f6daf8aad68	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	657480ca-7532-4af1-a318-da2913479a0e
f3934b6d-2c26-4f6a-aaea-843f71ef10e1	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	d22c4428-8508-4dd2-8f38-7ce189a5609f
576e77aa-31c9-4736-9098-93f272594f01	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
6ff68993-7d9b-40ca-a12f-cbba047fec75	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
0245d6c8-de83-4777-91b5-a6600c4b8c2f	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	26a9b4ca-f968-423b-ae26-c3d2e2692446
5a47ca14-2dce-4114-b292-e95dbf5e4951	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	d22c4428-8508-4dd2-8f38-7ce189a5609f
062627c6-76e5-4582-a4ea-3cad7cf686cc	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
2d1ff6cf-89c9-4815-8e58-c99ce91687da	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	657480ca-7532-4af1-a318-da2913479a0e
8dbd7335-0909-4d3c-8015-39f83df43826	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
0664c5b9-16f1-4c54-ae87-c0b8cd5e7888	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	072c8a4f-d84d-45fc-af2a-1f0186742e29
983ed6b1-1f2b-42ff-ab04-57f250297a9d	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	f72d4d9c-3000-406c-8cc1-be093dc1de57
0ecc429c-752c-4fb9-b5a5-e2d9bfb7aa41	f3c7b348-1234-42d8-94ad-8490df57863a	26a9b4ca-f968-423b-ae26-c3d2e2692446
e180621b-5c81-415a-908a-23cee33df1c7	f3c7b348-1234-42d8-94ad-8490df57863a	072c8a4f-d84d-45fc-af2a-1f0186742e29
987ba2e9-2430-417d-80b4-8d60a1f2e1be	f3c7b348-1234-42d8-94ad-8490df57863a	d22c4428-8508-4dd2-8f38-7ce189a5609f
2e0e932d-69ae-495a-8b70-1ad16e7fcb6b	f3c7b348-1234-42d8-94ad-8490df57863a	657480ca-7532-4af1-a318-da2913479a0e
f04b27b9-d2d5-41ff-a13f-9b3d210b6a74	f3c7b348-1234-42d8-94ad-8490df57863a	f72d4d9c-3000-406c-8cc1-be093dc1de57
a9d134db-a291-47ac-8bd7-09481672605e	f3c7b348-1234-42d8-94ad-8490df57863a	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1a042c21-e385-4a6f-a5de-483737b0efaf	f3c7b348-1234-42d8-94ad-8490df57863a	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
268cfb37-baf9-4d2d-a900-97bc2669b0b4	ae780740-6d72-41ca-9ea9-81ba82c1f662	26a9b4ca-f968-423b-ae26-c3d2e2692446
7349efe9-30e6-476a-956f-d6ff07bf1e28	ae780740-6d72-41ca-9ea9-81ba82c1f662	072c8a4f-d84d-45fc-af2a-1f0186742e29
fb7bb5dc-5b5f-4ab4-ac15-7cc1ee073c6e	ae780740-6d72-41ca-9ea9-81ba82c1f662	d22c4428-8508-4dd2-8f38-7ce189a5609f
479257cb-fb5e-408d-976f-c0b53d5337ff	ae780740-6d72-41ca-9ea9-81ba82c1f662	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
8f61dc19-c5a4-4d96-8077-d2e0b1902d98	ae780740-6d72-41ca-9ea9-81ba82c1f662	657480ca-7532-4af1-a318-da2913479a0e
1678cd1c-5745-4c4c-81f9-c578616c7da2	ae780740-6d72-41ca-9ea9-81ba82c1f662	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
22df2ce2-c2fe-4192-b142-d1d41578228b	ae780740-6d72-41ca-9ea9-81ba82c1f662	f72d4d9c-3000-406c-8cc1-be093dc1de57
f0d109f2-63de-45a4-89cc-12db8a1bc702	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	26a9b4ca-f968-423b-ae26-c3d2e2692446
37b9edff-0dd4-4f16-9d45-b60d758dd016	17deaf36-d2f5-4c45-af32-94d207a5f69d	26a9b4ca-f968-423b-ae26-c3d2e2692446
011b420d-4c69-4fc3-96bc-5f4a676bb573	b53daec8-b909-4268-9211-0323217aba95	26a9b4ca-f968-423b-ae26-c3d2e2692446
4f656f85-d83b-45cc-aedb-d45a0c180ffa	c163cd2f-ffc1-4096-84b6-407547820de6	26a9b4ca-f968-423b-ae26-c3d2e2692446
08cf83a8-0945-4dc0-b9ad-c1f1c2f660a8	c3baacd5-6a2c-4568-87d3-b1412ec697d4	26a9b4ca-f968-423b-ae26-c3d2e2692446
a36da656-1258-415b-9e0d-b3f70593a670	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	26a9b4ca-f968-423b-ae26-c3d2e2692446
51149059-489d-4860-b240-4af26a50b284	50248627-b1ee-4a7e-b277-030d6630d5de	26a9b4ca-f968-423b-ae26-c3d2e2692446
385ee338-c525-430f-a9a9-801dcdb8289b	4ce1e015-14b2-4457-8e03-c0f827ee81da	26a9b4ca-f968-423b-ae26-c3d2e2692446
c277057a-74c5-4d6c-b8f9-3fa18d77efb0	1dae37f3-a38d-4a6e-a1cb-3997624e4172	26a9b4ca-f968-423b-ae26-c3d2e2692446
19a1ac0c-831a-439f-a5a8-04c9387e5bab	47caa164-b374-44ea-a106-4bb4fd669148	26a9b4ca-f968-423b-ae26-c3d2e2692446
abfef0ef-d3af-4fe2-9f39-06cc2d727d7b	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	26a9b4ca-f968-423b-ae26-c3d2e2692446
c75e27b9-c01d-44cb-8bec-cb6c7cf86d09	c5a9766d-4162-4a24-b7fb-df0c5107bca2	26a9b4ca-f968-423b-ae26-c3d2e2692446
0e965aaa-90af-4608-a484-a1859d752b8d	e75bebe3-f0be-4c97-9362-080110ae7ed7	26a9b4ca-f968-423b-ae26-c3d2e2692446
5b242df5-f3aa-4159-b310-01e821081a77	55ee460d-7d0c-4de9-9cda-04e1be396e9d	26a9b4ca-f968-423b-ae26-c3d2e2692446
598349e7-bd5a-44a5-83a0-bb74ad6e198d	78080f63-ca42-4303-a261-4641a275237f	26a9b4ca-f968-423b-ae26-c3d2e2692446
04dd8b62-8337-47f2-97d0-15cf8779b79e	ad4288c3-dc75-46e2-b727-71f2e8a57099	26a9b4ca-f968-423b-ae26-c3d2e2692446
be3ea983-89fd-4e34-8dba-cd06b21989c0	3f12f2f7-76b4-4981-900e-d12336f9ae23	26a9b4ca-f968-423b-ae26-c3d2e2692446
1ea75243-1c77-450b-8d88-4d87444a8b2e	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	26a9b4ca-f968-423b-ae26-c3d2e2692446
5f9fcc53-4079-4b5d-a998-635794449f06	91da7ef2-f322-4fab-b845-9cb701e848aa	26a9b4ca-f968-423b-ae26-c3d2e2692446
21b1f8d3-1206-4629-99d2-9594f311cf97	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	26a9b4ca-f968-423b-ae26-c3d2e2692446
ab66d2c4-c11c-43b3-8a82-b9bbd2f94a9d	a8d71a94-a068-4d50-87d8-cbfca70d2c29	26a9b4ca-f968-423b-ae26-c3d2e2692446
c6c65cd9-fc49-4932-bf28-9e475bc3bf31	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	26a9b4ca-f968-423b-ae26-c3d2e2692446
b1b79993-d4fc-4344-afb4-5f8f2f4cb096	3461d1ba-93ee-4255-b744-c31afcc88870	26a9b4ca-f968-423b-ae26-c3d2e2692446
d4339298-bbfe-4aae-9f93-8153cd10fdb6	0250c85a-8d59-4045-8103-1ecb5e030537	26a9b4ca-f968-423b-ae26-c3d2e2692446
013d1301-777a-414c-8791-db1b3f8cfbd7	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	26a9b4ca-f968-423b-ae26-c3d2e2692446
acbf3010-668a-4312-9771-a715010959a4	fd073c81-b291-482d-81fe-9730027ff33a	26a9b4ca-f968-423b-ae26-c3d2e2692446
605384d9-9b46-4db3-9f07-0fee0d70ef08	ee5684cd-dc56-4e7f-818d-64a40135ee57	26a9b4ca-f968-423b-ae26-c3d2e2692446
1679f822-6f37-4f88-aeaa-b9878a8bf2c1	32ca3d58-2527-4536-95d3-b0e1a68065e8	26a9b4ca-f968-423b-ae26-c3d2e2692446
ae89b88d-41dd-42dc-a76c-4e77e83a50a0	70b83387-b52d-4634-95cb-847a74ca6ea7	26a9b4ca-f968-423b-ae26-c3d2e2692446
a3c8a068-b765-4a8d-9a1f-92407378f8c6	f8e35850-947d-41a7-a2a1-84bc08785a92	26a9b4ca-f968-423b-ae26-c3d2e2692446
8175564e-4c9a-4e74-a313-eafd70530bf7	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	26a9b4ca-f968-423b-ae26-c3d2e2692446
97835f80-318b-4c58-91a1-ec674777abc1	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	26a9b4ca-f968-423b-ae26-c3d2e2692446
d64af87e-5589-439a-a4d3-75ce967df488	e1668d3f-1c54-4f8e-80c8-2978206232ae	26a9b4ca-f968-423b-ae26-c3d2e2692446
e6dbcc08-d50e-4ae2-a30e-ce540c3a2706	4f87f3de-0452-45ad-8dbb-598e58b27d81	26a9b4ca-f968-423b-ae26-c3d2e2692446
6d39b900-4f9d-4731-9a8e-913400db9b0a	e06741c9-66c3-40a8-a253-7c54413a8a93	26a9b4ca-f968-423b-ae26-c3d2e2692446
75aa6d7b-c5c1-4e78-b58e-c2597e4bceec	984dab09-fbc5-4954-a2a9-c259911413fe	26a9b4ca-f968-423b-ae26-c3d2e2692446
d3119334-194b-4cc4-9490-28f3ed64111b	f237f8ee-4610-4d33-ac93-c07f59233888	26a9b4ca-f968-423b-ae26-c3d2e2692446
9cc42045-17b7-4ac8-bfae-13b9349d1511	ea15fc00-7111-46df-9624-bf7d6b1fc057	26a9b4ca-f968-423b-ae26-c3d2e2692446
460af0d2-40c6-4b30-a27d-856fc31da474	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	26a9b4ca-f968-423b-ae26-c3d2e2692446
987bc7b2-0a27-4e55-8122-906388d7dd8c	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	26a9b4ca-f968-423b-ae26-c3d2e2692446
c4132a91-0b82-4cfc-8ce7-3621bbe134f1	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	26a9b4ca-f968-423b-ae26-c3d2e2692446
71f7eea6-5179-4797-ba26-3c16036a5547	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	d22c4428-8508-4dd2-8f38-7ce189a5609f
9999bb89-bdb0-4c51-b409-8927a2bdf53e	17deaf36-d2f5-4c45-af32-94d207a5f69d	d22c4428-8508-4dd2-8f38-7ce189a5609f
c7c786ea-07d1-4931-9087-a4c8e737c753	b53daec8-b909-4268-9211-0323217aba95	d22c4428-8508-4dd2-8f38-7ce189a5609f
1156cf12-3991-4fc5-998d-fcb19478e09f	c163cd2f-ffc1-4096-84b6-407547820de6	d22c4428-8508-4dd2-8f38-7ce189a5609f
039775fb-772d-431c-9925-cdf5fc788996	c3baacd5-6a2c-4568-87d3-b1412ec697d4	d22c4428-8508-4dd2-8f38-7ce189a5609f
747d92bf-7959-4935-a818-c41538d64ebb	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	d22c4428-8508-4dd2-8f38-7ce189a5609f
07462285-9eb3-4558-8fe9-4edaac29a047	50248627-b1ee-4a7e-b277-030d6630d5de	d22c4428-8508-4dd2-8f38-7ce189a5609f
0bf03f3a-46e0-4c24-97e6-3d24975b6bd0	4ce1e015-14b2-4457-8e03-c0f827ee81da	d22c4428-8508-4dd2-8f38-7ce189a5609f
83f7cdec-b7d7-4c14-84d2-bd1630e576b7	1dae37f3-a38d-4a6e-a1cb-3997624e4172	d22c4428-8508-4dd2-8f38-7ce189a5609f
d2f8c315-5bd5-41de-8157-889f9fa22a80	47caa164-b374-44ea-a106-4bb4fd669148	d22c4428-8508-4dd2-8f38-7ce189a5609f
c47b3f92-267a-4429-b882-c66b8fc9d6fc	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	d22c4428-8508-4dd2-8f38-7ce189a5609f
355c8ec5-8a20-479a-bfce-d852e43ff48b	c5a9766d-4162-4a24-b7fb-df0c5107bca2	d22c4428-8508-4dd2-8f38-7ce189a5609f
2faceec3-be93-4d8f-8704-8b4c072fb4d0	e75bebe3-f0be-4c97-9362-080110ae7ed7	d22c4428-8508-4dd2-8f38-7ce189a5609f
8d46db82-47fe-48d7-a75d-62c325d284dd	55ee460d-7d0c-4de9-9cda-04e1be396e9d	d22c4428-8508-4dd2-8f38-7ce189a5609f
5f75c2d8-ff69-495a-a74f-95be4cc1b122	78080f63-ca42-4303-a261-4641a275237f	d22c4428-8508-4dd2-8f38-7ce189a5609f
4315ee6a-fe6a-417a-af7e-4e2ca02b4b31	ad4288c3-dc75-46e2-b727-71f2e8a57099	d22c4428-8508-4dd2-8f38-7ce189a5609f
86b42008-5854-4bf9-9d3c-a0187905e34f	3f12f2f7-76b4-4981-900e-d12336f9ae23	d22c4428-8508-4dd2-8f38-7ce189a5609f
00bf6836-28cb-462a-9e89-eca9f7e9df0c	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	d22c4428-8508-4dd2-8f38-7ce189a5609f
d9efc357-0933-492d-8554-0f7aced4a76e	91da7ef2-f322-4fab-b845-9cb701e848aa	d22c4428-8508-4dd2-8f38-7ce189a5609f
1eea1bb5-cd4f-47cc-9de1-d657be46b752	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	d22c4428-8508-4dd2-8f38-7ce189a5609f
d1b4c164-fca8-4779-8c1d-861682bd7a53	a8d71a94-a068-4d50-87d8-cbfca70d2c29	d22c4428-8508-4dd2-8f38-7ce189a5609f
5482b102-f5fe-4115-b709-17007b13dbc3	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	d22c4428-8508-4dd2-8f38-7ce189a5609f
c8dc317d-9358-4cb4-9662-89317057ce90	3461d1ba-93ee-4255-b744-c31afcc88870	d22c4428-8508-4dd2-8f38-7ce189a5609f
72b62679-eda5-4377-98a8-5d35cbab7d01	0250c85a-8d59-4045-8103-1ecb5e030537	d22c4428-8508-4dd2-8f38-7ce189a5609f
abdcce64-0917-45a9-9ca1-b196b145b09c	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	d22c4428-8508-4dd2-8f38-7ce189a5609f
00af065c-db33-4199-939d-f37ac0d899d1	fd073c81-b291-482d-81fe-9730027ff33a	d22c4428-8508-4dd2-8f38-7ce189a5609f
8202fe16-ce5f-4577-9aac-569349a8c0af	ee5684cd-dc56-4e7f-818d-64a40135ee57	d22c4428-8508-4dd2-8f38-7ce189a5609f
0267888f-235f-48e7-aa8c-1c1bf7c95bad	32ca3d58-2527-4536-95d3-b0e1a68065e8	d22c4428-8508-4dd2-8f38-7ce189a5609f
27edcecb-2c15-4abb-a101-8874b298c07d	70b83387-b52d-4634-95cb-847a74ca6ea7	d22c4428-8508-4dd2-8f38-7ce189a5609f
9e54adf1-7a53-4f79-8b7a-fda657084c3c	f8e35850-947d-41a7-a2a1-84bc08785a92	d22c4428-8508-4dd2-8f38-7ce189a5609f
e5523319-2915-4906-8f0f-f64cc223b489	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	d22c4428-8508-4dd2-8f38-7ce189a5609f
8febf8b4-7957-4986-a42a-ecaae1787198	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	d22c4428-8508-4dd2-8f38-7ce189a5609f
9cde0272-817a-4b19-bd53-252fd0b0d1ac	e1668d3f-1c54-4f8e-80c8-2978206232ae	d22c4428-8508-4dd2-8f38-7ce189a5609f
9ac5c727-e7a6-471c-865e-c1b34509d4a8	4f87f3de-0452-45ad-8dbb-598e58b27d81	d22c4428-8508-4dd2-8f38-7ce189a5609f
56a241a1-5e36-453d-85a2-32dc709b6fa3	e06741c9-66c3-40a8-a253-7c54413a8a93	d22c4428-8508-4dd2-8f38-7ce189a5609f
81313196-a902-4335-acaf-165bbd2f10bd	984dab09-fbc5-4954-a2a9-c259911413fe	d22c4428-8508-4dd2-8f38-7ce189a5609f
5a72cfb3-22c1-479e-8a07-dad7a8cd36db	f237f8ee-4610-4d33-ac93-c07f59233888	d22c4428-8508-4dd2-8f38-7ce189a5609f
07b640ef-d597-4a42-9581-897b34d05142	ea15fc00-7111-46df-9624-bf7d6b1fc057	d22c4428-8508-4dd2-8f38-7ce189a5609f
3c795bac-3eea-492b-ada4-9a98c6c4c9e4	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	d22c4428-8508-4dd2-8f38-7ce189a5609f
88e87ddf-fa6d-4ab6-ae33-040b3cb8bbfe	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	d22c4428-8508-4dd2-8f38-7ce189a5609f
f6cceb87-010f-4141-aab9-e22b36eb08cc	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	d22c4428-8508-4dd2-8f38-7ce189a5609f
0fb5c9ba-6cfa-47d8-be37-b9720a9a2b5e	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	657480ca-7532-4af1-a318-da2913479a0e
da17cfe3-9bdf-41a3-bfa7-d65e3ff7cfbc	17deaf36-d2f5-4c45-af32-94d207a5f69d	657480ca-7532-4af1-a318-da2913479a0e
4b033034-868b-465f-a80a-68631adba359	b53daec8-b909-4268-9211-0323217aba95	657480ca-7532-4af1-a318-da2913479a0e
cbebd093-e835-4fe3-95e2-e3a8fb90ed3b	c163cd2f-ffc1-4096-84b6-407547820de6	657480ca-7532-4af1-a318-da2913479a0e
1eb7c3a8-5a98-40b4-b230-1a20a3a5612e	c3baacd5-6a2c-4568-87d3-b1412ec697d4	657480ca-7532-4af1-a318-da2913479a0e
ad6872e4-f933-4e85-9cee-ea178805718f	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	657480ca-7532-4af1-a318-da2913479a0e
faaf4017-751b-423d-9629-275832fab0ee	50248627-b1ee-4a7e-b277-030d6630d5de	657480ca-7532-4af1-a318-da2913479a0e
a6b1da0f-6f3f-492e-9d2f-434574f99608	4ce1e015-14b2-4457-8e03-c0f827ee81da	657480ca-7532-4af1-a318-da2913479a0e
d1b5082b-4b46-4d32-92ec-dfd911697b36	1dae37f3-a38d-4a6e-a1cb-3997624e4172	657480ca-7532-4af1-a318-da2913479a0e
fa57bb42-b202-444d-a152-619514ff1f6b	47caa164-b374-44ea-a106-4bb4fd669148	657480ca-7532-4af1-a318-da2913479a0e
64302ad1-96df-4d2b-8469-50a3f1171ad1	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	657480ca-7532-4af1-a318-da2913479a0e
474ddd29-a2b7-442a-9f22-b0ffad816d74	c5a9766d-4162-4a24-b7fb-df0c5107bca2	657480ca-7532-4af1-a318-da2913479a0e
97e93ca2-70d0-4361-ac30-bde826fdee81	e75bebe3-f0be-4c97-9362-080110ae7ed7	657480ca-7532-4af1-a318-da2913479a0e
5897a09c-2c69-4ec0-b22e-bacbda5eaa9d	55ee460d-7d0c-4de9-9cda-04e1be396e9d	657480ca-7532-4af1-a318-da2913479a0e
3b3b14c4-384a-49f3-b350-1356e8237423	78080f63-ca42-4303-a261-4641a275237f	657480ca-7532-4af1-a318-da2913479a0e
e426df8c-453f-4de9-a89b-9cc6a93fbc77	ad4288c3-dc75-46e2-b727-71f2e8a57099	657480ca-7532-4af1-a318-da2913479a0e
f9740bae-f619-45fc-884b-bc32dd3665ff	3f12f2f7-76b4-4981-900e-d12336f9ae23	657480ca-7532-4af1-a318-da2913479a0e
32e58737-bb50-4e53-9565-2e5d63f94f4d	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	657480ca-7532-4af1-a318-da2913479a0e
49ce925a-3ffc-40fd-8f8f-a607788ac1e6	91da7ef2-f322-4fab-b845-9cb701e848aa	657480ca-7532-4af1-a318-da2913479a0e
c3be35a4-60c6-4424-bc70-063055e4c93a	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	657480ca-7532-4af1-a318-da2913479a0e
a40e8f99-03a9-4c10-8d2a-4606e4f1ed42	a8d71a94-a068-4d50-87d8-cbfca70d2c29	657480ca-7532-4af1-a318-da2913479a0e
353db7af-e0aa-4506-adaf-21aae5840def	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	657480ca-7532-4af1-a318-da2913479a0e
63d93768-8707-4daa-acc4-ef0f7066d276	3461d1ba-93ee-4255-b744-c31afcc88870	657480ca-7532-4af1-a318-da2913479a0e
771fa783-51a0-4b12-b47b-443ffecb2175	0250c85a-8d59-4045-8103-1ecb5e030537	657480ca-7532-4af1-a318-da2913479a0e
9a9c634d-745d-4a3f-bc88-a81e354cf7ad	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	657480ca-7532-4af1-a318-da2913479a0e
4d4edce8-5bd8-47b3-ba4f-669193492bf8	fd073c81-b291-482d-81fe-9730027ff33a	657480ca-7532-4af1-a318-da2913479a0e
a6eaf2f2-8786-443f-b853-1c45fe6be6ad	ee5684cd-dc56-4e7f-818d-64a40135ee57	657480ca-7532-4af1-a318-da2913479a0e
809e1223-b01c-40d7-8e7c-3944a57c0c3a	32ca3d58-2527-4536-95d3-b0e1a68065e8	657480ca-7532-4af1-a318-da2913479a0e
e3e46a2c-304a-4898-8570-97d25d008014	70b83387-b52d-4634-95cb-847a74ca6ea7	657480ca-7532-4af1-a318-da2913479a0e
edb7ec08-5218-4d56-a237-23faf491e853	f8e35850-947d-41a7-a2a1-84bc08785a92	657480ca-7532-4af1-a318-da2913479a0e
f8402d24-53b8-4dde-8f75-5642ac3514f2	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	657480ca-7532-4af1-a318-da2913479a0e
8eb3d1ce-c181-48d9-a862-cf0244d112e9	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	657480ca-7532-4af1-a318-da2913479a0e
3aef989e-4ab7-4194-bbf2-e0a4c102a99d	e1668d3f-1c54-4f8e-80c8-2978206232ae	657480ca-7532-4af1-a318-da2913479a0e
00557cdf-28e4-4d7b-9160-dec14297083a	4f87f3de-0452-45ad-8dbb-598e58b27d81	657480ca-7532-4af1-a318-da2913479a0e
e094e50a-3d8e-414e-927b-921398950858	e06741c9-66c3-40a8-a253-7c54413a8a93	657480ca-7532-4af1-a318-da2913479a0e
19482779-55ef-405d-a32d-2b3ae41cf6cf	984dab09-fbc5-4954-a2a9-c259911413fe	657480ca-7532-4af1-a318-da2913479a0e
a4d7dc2c-377e-4249-8505-0003a4677a7c	f237f8ee-4610-4d33-ac93-c07f59233888	657480ca-7532-4af1-a318-da2913479a0e
0aeb3e89-cfeb-4df0-918e-1f30317902e0	ea15fc00-7111-46df-9624-bf7d6b1fc057	657480ca-7532-4af1-a318-da2913479a0e
413aba08-3dc3-4b99-ba51-f009f5077536	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	657480ca-7532-4af1-a318-da2913479a0e
906ebee3-8421-415c-8bcc-32408ff338a0	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	657480ca-7532-4af1-a318-da2913479a0e
bdf9a326-d2b7-4cd4-977d-915d3b327a79	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	657480ca-7532-4af1-a318-da2913479a0e
5c7dd68e-9f5f-4b1d-b9d2-6c69c2026d30	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
a87bc30d-2917-490c-9d7b-e2f9333f05fd	17deaf36-d2f5-4c45-af32-94d207a5f69d	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
f987e8fd-b87b-42bd-bbfa-7fa7ce9356d2	b53daec8-b909-4268-9211-0323217aba95	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
dccc6be5-60a7-4f16-b678-8fdaa317c01e	c163cd2f-ffc1-4096-84b6-407547820de6	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
f26b753f-4598-4588-aa94-a2793d366555	c3baacd5-6a2c-4568-87d3-b1412ec697d4	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
4721c948-1793-4468-8d51-3c75f499a404	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
f3ac361f-82dd-48fb-b37f-277c660b4992	50248627-b1ee-4a7e-b277-030d6630d5de	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
7325fd65-27f9-4195-98ba-8e96dafa970c	4ce1e015-14b2-4457-8e03-c0f827ee81da	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
f4d7357d-f285-4949-9393-cb5aaebf3d25	1dae37f3-a38d-4a6e-a1cb-3997624e4172	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
3f1866d2-fb10-4711-840d-d740c2aef066	47caa164-b374-44ea-a106-4bb4fd669148	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
309004d9-9f47-4fd1-a3ca-ddcbd7683e2e	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
a05f5143-ffa7-4330-9853-f4670ed00c68	c5a9766d-4162-4a24-b7fb-df0c5107bca2	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
4a0ce78b-872e-48bf-b1f6-dcddc79d3b8c	e75bebe3-f0be-4c97-9362-080110ae7ed7	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
2763fc58-790c-4787-a954-4048186afe96	55ee460d-7d0c-4de9-9cda-04e1be396e9d	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
b11241e3-9616-486e-878c-deaeea2aed1a	78080f63-ca42-4303-a261-4641a275237f	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
0e0f1049-38da-4970-ad39-53f1e7c3cb75	ad4288c3-dc75-46e2-b727-71f2e8a57099	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
39294363-23a6-475b-aaac-5187f7db86ac	3f12f2f7-76b4-4981-900e-d12336f9ae23	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
4496e1a2-4b86-4e14-a0cc-c4e5f2bd6283	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
5e92c9cf-bdad-434d-87f2-bfa95796cc77	91da7ef2-f322-4fab-b845-9cb701e848aa	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
68d42f57-2f61-4a3d-88f6-9892335c92d9	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1f617cc3-28af-4ec2-bd73-466b702ec8a9	a8d71a94-a068-4d50-87d8-cbfca70d2c29	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1ff47838-fda7-4743-b9a0-4e449713abd8	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
33996220-0e5e-48ac-8d4a-0481c38f3aa7	3461d1ba-93ee-4255-b744-c31afcc88870	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
2f65018e-e124-4a5f-aad8-272d0973904e	0250c85a-8d59-4045-8103-1ecb5e030537	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
a715049e-5ee8-46f0-964d-9a7c66e375ab	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
2f434222-6eff-4e18-8d16-2cc3596e00a1	fd073c81-b291-482d-81fe-9730027ff33a	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
584e0408-cad0-402d-84a0-e95de0271f17	ee5684cd-dc56-4e7f-818d-64a40135ee57	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
57e7f11a-bf14-44bb-96d4-8a62119d7afd	32ca3d58-2527-4536-95d3-b0e1a68065e8	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
978b14f0-e713-44d1-be4a-d1fe4aa2bed4	70b83387-b52d-4634-95cb-847a74ca6ea7	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
7f753294-169e-487d-bb47-6f52a259a197	f8e35850-947d-41a7-a2a1-84bc08785a92	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
06dfec68-2d25-4c3b-9aea-3cfe3f2603e4	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
6d3e46f7-e03a-430d-88de-17a152d70ffd	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
4b29b444-ae3a-46f9-affe-4a7e950796d5	e1668d3f-1c54-4f8e-80c8-2978206232ae	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
eb4dc63c-e27d-49dc-a1f7-575db861c161	4f87f3de-0452-45ad-8dbb-598e58b27d81	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
d7951f58-631e-4fd6-b989-7d359ce138cb	e06741c9-66c3-40a8-a253-7c54413a8a93	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1d6c77ae-5c7e-4bb6-960b-26c40d7a9268	984dab09-fbc5-4954-a2a9-c259911413fe	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
53106e5f-bfe2-4e60-9b6e-3b8b27a8c0a4	f237f8ee-4610-4d33-ac93-c07f59233888	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
ad6c7057-4723-46a8-bbe0-859f9fd40408	ea15fc00-7111-46df-9624-bf7d6b1fc057	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
b21c8cb0-6073-4622-83a2-fd644b89bb5e	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
b09ea107-221b-492a-8bff-d56dd7b2b7c7	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
95c05a6b-71d5-4b47-b272-5dab3d58d721	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
76737f2b-cfc2-4b99-a203-862f06b922f4	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
78775d80-f0cb-47df-82fa-b2142c6a4a1c	17deaf36-d2f5-4c45-af32-94d207a5f69d	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
db3c65c3-308a-4048-9d9e-afd399888fc6	b53daec8-b909-4268-9211-0323217aba95	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
9a5234d3-f824-4c1b-b235-89f62dcb865d	c163cd2f-ffc1-4096-84b6-407547820de6	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
7179a86b-7ecc-4b3d-9c7e-d587ad7c45dc	c3baacd5-6a2c-4568-87d3-b1412ec697d4	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
d780d64e-f40d-45d0-8a8b-63776373b36a	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
469f88d6-124c-4a42-ba65-001076346dbe	50248627-b1ee-4a7e-b277-030d6630d5de	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
d39e7b26-d342-478d-8fb4-ff6889536743	4ce1e015-14b2-4457-8e03-c0f827ee81da	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
c8623940-856a-45f9-9492-eaa42c598206	1dae37f3-a38d-4a6e-a1cb-3997624e4172	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
d9da6758-f33b-45d3-882e-6c814ddfbed1	47caa164-b374-44ea-a106-4bb4fd669148	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
9b4b2c0c-10bf-480a-af72-c0fcda348af7	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
bae6460a-6526-4ad8-85f1-342d1e42444f	c5a9766d-4162-4a24-b7fb-df0c5107bca2	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
278a3dac-7317-4ed5-8c49-929160113d60	e75bebe3-f0be-4c97-9362-080110ae7ed7	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
3aa5d844-a0b8-434a-b415-305d78d5a4bb	55ee460d-7d0c-4de9-9cda-04e1be396e9d	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
79f536f2-7646-43ac-aab7-1ed3250eb5ab	78080f63-ca42-4303-a261-4641a275237f	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
7eda3054-b89c-43d3-913e-4b5c27414052	ad4288c3-dc75-46e2-b727-71f2e8a57099	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
aa24b766-1c09-407f-99cb-088662ab01e9	3f12f2f7-76b4-4981-900e-d12336f9ae23	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
8c8f8b54-c132-47a4-9626-7d1f90362e35	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
4786ef5e-7b55-4dfb-aab3-62b7899df024	91da7ef2-f322-4fab-b845-9cb701e848aa	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
120575cc-2e76-45ee-988d-d5bb4b1d2709	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
f1afca5b-1d2b-4fdc-b066-ba68207ccd11	a8d71a94-a068-4d50-87d8-cbfca70d2c29	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
9502cc00-3468-4e49-9525-e36e74053366	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
ba7c5d72-e0d3-4cfd-9747-f9b831365e62	3461d1ba-93ee-4255-b744-c31afcc88870	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
a1909d87-219c-43f6-9ddc-b70b28ccaad3	0250c85a-8d59-4045-8103-1ecb5e030537	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
e11dde57-01e6-4b09-91f3-f1f298a6b7a2	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
d9c2118a-2c94-4c26-8441-b25356c81aac	fd073c81-b291-482d-81fe-9730027ff33a	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
52b88807-0f22-4175-baae-8ad4ecaa571e	ee5684cd-dc56-4e7f-818d-64a40135ee57	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
e92440cf-3428-464b-b8b2-9b09a661ee41	32ca3d58-2527-4536-95d3-b0e1a68065e8	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
70bc92af-31fc-4301-9e4d-1b708e3d179a	70b83387-b52d-4634-95cb-847a74ca6ea7	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
9936569c-dfb7-443c-b9ea-9c6d9f701477	f8e35850-947d-41a7-a2a1-84bc08785a92	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
b5797dc3-2c56-48e0-bd19-b18786f22080	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
b1c96acd-1688-4561-9f7b-cf6e9cc7b242	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
1e8b568e-ffb4-4cd7-bc3e-94953ae4ead6	e1668d3f-1c54-4f8e-80c8-2978206232ae	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
673c4b15-11a5-4167-ab65-be16a51e792f	4f87f3de-0452-45ad-8dbb-598e58b27d81	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
f32835fc-097a-48bb-8cce-9f5ceb409111	e06741c9-66c3-40a8-a253-7c54413a8a93	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
4c546ddf-efac-49c0-98ef-b239a20bd3eb	984dab09-fbc5-4954-a2a9-c259911413fe	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
9cb986ca-7670-44bf-b5e7-411b8f7e67de	f237f8ee-4610-4d33-ac93-c07f59233888	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
6ba96531-fde9-4271-bba6-a9a657d9486e	ea15fc00-7111-46df-9624-bf7d6b1fc057	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
1a325e28-7c53-47e4-8ba5-1f35a8254771	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
778faff8-94bf-4e73-babb-53e215b479b5	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
ff77b9d7-9756-4e77-8dec-5a7153d54ddb	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
7595bc89-03d8-4318-b945-3df3db5d9042	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	072c8a4f-d84d-45fc-af2a-1f0186742e29
8d0d56fc-b5af-476e-9897-c44101b94a54	17deaf36-d2f5-4c45-af32-94d207a5f69d	072c8a4f-d84d-45fc-af2a-1f0186742e29
0bbe8565-ceb3-4289-a11c-9996937feee2	b53daec8-b909-4268-9211-0323217aba95	072c8a4f-d84d-45fc-af2a-1f0186742e29
a92f7547-6f06-49a3-8e47-cffaae14a7ce	c163cd2f-ffc1-4096-84b6-407547820de6	072c8a4f-d84d-45fc-af2a-1f0186742e29
8fd685cc-a00d-4c55-b860-31d7fb553a56	c3baacd5-6a2c-4568-87d3-b1412ec697d4	072c8a4f-d84d-45fc-af2a-1f0186742e29
bb3f2153-a60e-4d48-9d27-2db72fc1578e	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	072c8a4f-d84d-45fc-af2a-1f0186742e29
c6c59c26-85e0-43d2-b55a-e990d99a8c1c	50248627-b1ee-4a7e-b277-030d6630d5de	072c8a4f-d84d-45fc-af2a-1f0186742e29
4a0fc8c0-a305-47b0-a5ea-46908edda4df	4ce1e015-14b2-4457-8e03-c0f827ee81da	072c8a4f-d84d-45fc-af2a-1f0186742e29
87d8c751-d749-45d6-aea4-8856a136f86d	1dae37f3-a38d-4a6e-a1cb-3997624e4172	072c8a4f-d84d-45fc-af2a-1f0186742e29
d16ed8f6-28bf-429b-ae74-ab7d1d1463d9	47caa164-b374-44ea-a106-4bb4fd669148	072c8a4f-d84d-45fc-af2a-1f0186742e29
56957f18-c313-4767-b2dc-73340b933db5	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	072c8a4f-d84d-45fc-af2a-1f0186742e29
9505691c-3371-4e75-867e-c58a360371d3	c5a9766d-4162-4a24-b7fb-df0c5107bca2	072c8a4f-d84d-45fc-af2a-1f0186742e29
90d3ecc7-a06a-4a27-a68d-4ade18f86549	e75bebe3-f0be-4c97-9362-080110ae7ed7	072c8a4f-d84d-45fc-af2a-1f0186742e29
50411aca-6e48-4237-b2a3-d8268c265e93	55ee460d-7d0c-4de9-9cda-04e1be396e9d	072c8a4f-d84d-45fc-af2a-1f0186742e29
4462c39c-cb1b-40b4-9b4f-14e3b2f2ab43	78080f63-ca42-4303-a261-4641a275237f	072c8a4f-d84d-45fc-af2a-1f0186742e29
e3aa2c69-279d-49bf-8cdd-00cab172e340	ad4288c3-dc75-46e2-b727-71f2e8a57099	072c8a4f-d84d-45fc-af2a-1f0186742e29
2c710976-538f-4408-8c20-f033c0d00af3	3f12f2f7-76b4-4981-900e-d12336f9ae23	072c8a4f-d84d-45fc-af2a-1f0186742e29
d252c6e8-987b-4ada-a5da-c68888b62f50	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	072c8a4f-d84d-45fc-af2a-1f0186742e29
3738e468-6740-4c7d-bb7d-7d1eb2ee0a2e	91da7ef2-f322-4fab-b845-9cb701e848aa	072c8a4f-d84d-45fc-af2a-1f0186742e29
021a6a11-a917-49cd-98d0-03c929a7d5e3	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	072c8a4f-d84d-45fc-af2a-1f0186742e29
e258ce31-609b-4468-afa3-acaf96ca0cb0	a8d71a94-a068-4d50-87d8-cbfca70d2c29	072c8a4f-d84d-45fc-af2a-1f0186742e29
7430a9d9-c806-4b1c-af53-abcdbc63f950	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	072c8a4f-d84d-45fc-af2a-1f0186742e29
b544b606-9ec4-4339-8c81-243dd3c7fabc	3461d1ba-93ee-4255-b744-c31afcc88870	072c8a4f-d84d-45fc-af2a-1f0186742e29
80aef26a-77a6-4aef-86fc-8ecd558a32e9	0250c85a-8d59-4045-8103-1ecb5e030537	072c8a4f-d84d-45fc-af2a-1f0186742e29
5954a49d-2a71-43a7-92c8-dd8fef8c1627	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	072c8a4f-d84d-45fc-af2a-1f0186742e29
783a5926-e4b2-4b2e-9be8-ad32768737ea	fd073c81-b291-482d-81fe-9730027ff33a	072c8a4f-d84d-45fc-af2a-1f0186742e29
244e5906-9f02-42d0-9044-88d6c65bec93	ee5684cd-dc56-4e7f-818d-64a40135ee57	072c8a4f-d84d-45fc-af2a-1f0186742e29
dc8c6d25-9e3b-4678-a973-c0f391e60fa8	32ca3d58-2527-4536-95d3-b0e1a68065e8	072c8a4f-d84d-45fc-af2a-1f0186742e29
a5cbd11b-7332-48ff-8666-9cf6aa8cf300	70b83387-b52d-4634-95cb-847a74ca6ea7	072c8a4f-d84d-45fc-af2a-1f0186742e29
d4264081-a56f-474d-92ec-13ee4ad8deee	f8e35850-947d-41a7-a2a1-84bc08785a92	072c8a4f-d84d-45fc-af2a-1f0186742e29
f8d1f82b-bc1e-4d7f-aba9-9f98e0fcd931	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	072c8a4f-d84d-45fc-af2a-1f0186742e29
849c291f-95cb-43b9-a819-9bb62cfc017a	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	072c8a4f-d84d-45fc-af2a-1f0186742e29
1e9d5ad1-154b-4e1c-b53e-1e3f91ffb9d0	e1668d3f-1c54-4f8e-80c8-2978206232ae	072c8a4f-d84d-45fc-af2a-1f0186742e29
7d20013b-d0e0-4a92-aa6e-b13aeedd6df1	4f87f3de-0452-45ad-8dbb-598e58b27d81	072c8a4f-d84d-45fc-af2a-1f0186742e29
ff33c3b3-8d82-4cea-9e98-58353319566c	e06741c9-66c3-40a8-a253-7c54413a8a93	072c8a4f-d84d-45fc-af2a-1f0186742e29
7f9bd33e-be9f-4411-ba9d-fd4bb70b5be0	984dab09-fbc5-4954-a2a9-c259911413fe	072c8a4f-d84d-45fc-af2a-1f0186742e29
d344d21b-4ae6-4478-b842-6b9b38dadcc6	f237f8ee-4610-4d33-ac93-c07f59233888	072c8a4f-d84d-45fc-af2a-1f0186742e29
7d263bc6-d986-4c73-8e06-7845999ffe65	ea15fc00-7111-46df-9624-bf7d6b1fc057	072c8a4f-d84d-45fc-af2a-1f0186742e29
cf29d6d4-4207-4a55-91d9-e28a8aa1af4b	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	072c8a4f-d84d-45fc-af2a-1f0186742e29
5a07f0fa-232d-4fb9-bfaa-43e8fe6b420a	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	072c8a4f-d84d-45fc-af2a-1f0186742e29
74bcf405-fb6e-4ccd-a91e-e5f7bb5675a9	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	072c8a4f-d84d-45fc-af2a-1f0186742e29
485010d2-bfeb-419a-96b9-556247c7fd11	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	f72d4d9c-3000-406c-8cc1-be093dc1de57
43f09f2a-a153-47a0-a150-f421babe200e	17deaf36-d2f5-4c45-af32-94d207a5f69d	f72d4d9c-3000-406c-8cc1-be093dc1de57
66e34ba9-aeb9-458e-a60e-76426aa3ccbe	b53daec8-b909-4268-9211-0323217aba95	f72d4d9c-3000-406c-8cc1-be093dc1de57
0e761280-12ee-4c89-aca9-1c43619579b0	c163cd2f-ffc1-4096-84b6-407547820de6	f72d4d9c-3000-406c-8cc1-be093dc1de57
fbbbdd9b-87ae-4d26-9598-d2adfe7c9f61	c3baacd5-6a2c-4568-87d3-b1412ec697d4	f72d4d9c-3000-406c-8cc1-be093dc1de57
b5fca4c4-8f50-45cc-874c-85f7edb80848	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	f72d4d9c-3000-406c-8cc1-be093dc1de57
72e92da0-929c-4bc2-86c1-e6f43789e380	50248627-b1ee-4a7e-b277-030d6630d5de	f72d4d9c-3000-406c-8cc1-be093dc1de57
9f82c829-58ee-4af0-a9b7-9909b44a793f	4ce1e015-14b2-4457-8e03-c0f827ee81da	f72d4d9c-3000-406c-8cc1-be093dc1de57
84b5df18-0df0-4d05-b9e2-d8c2b7d79f9b	1dae37f3-a38d-4a6e-a1cb-3997624e4172	f72d4d9c-3000-406c-8cc1-be093dc1de57
83b88b1a-37e6-425b-982a-8d62b8707297	47caa164-b374-44ea-a106-4bb4fd669148	f72d4d9c-3000-406c-8cc1-be093dc1de57
784864e4-7c42-470f-b7ba-472719abee3e	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	f72d4d9c-3000-406c-8cc1-be093dc1de57
ff058788-2d82-43ae-9ef4-3098b108bc7e	c5a9766d-4162-4a24-b7fb-df0c5107bca2	f72d4d9c-3000-406c-8cc1-be093dc1de57
27d9e708-d053-4bcb-a04a-f45884fe5c9c	e75bebe3-f0be-4c97-9362-080110ae7ed7	f72d4d9c-3000-406c-8cc1-be093dc1de57
0a2e12b9-8aa6-4ca9-b655-a9d8455b3784	55ee460d-7d0c-4de9-9cda-04e1be396e9d	f72d4d9c-3000-406c-8cc1-be093dc1de57
ee9ec3bf-a4ac-4ac9-9cc2-c5495467e637	78080f63-ca42-4303-a261-4641a275237f	f72d4d9c-3000-406c-8cc1-be093dc1de57
c7e8d527-ce83-4e32-b054-fff05b5a34c5	ad4288c3-dc75-46e2-b727-71f2e8a57099	f72d4d9c-3000-406c-8cc1-be093dc1de57
0abf3257-e480-4c5f-ba7c-1cc3fb62ce8a	3f12f2f7-76b4-4981-900e-d12336f9ae23	f72d4d9c-3000-406c-8cc1-be093dc1de57
2f122bb5-af52-46ff-afd0-32e0f5e97a5e	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	f72d4d9c-3000-406c-8cc1-be093dc1de57
334b9c0d-a48a-4908-9df6-8e4b77a7b66a	91da7ef2-f322-4fab-b845-9cb701e848aa	f72d4d9c-3000-406c-8cc1-be093dc1de57
254d8c5c-4196-47bf-b023-38fb3cab877e	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	f72d4d9c-3000-406c-8cc1-be093dc1de57
56d9e27c-a69d-4796-b462-470c2aa97ec4	a8d71a94-a068-4d50-87d8-cbfca70d2c29	f72d4d9c-3000-406c-8cc1-be093dc1de57
25445856-ee8e-4d61-b297-8f96c3e97d75	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	f72d4d9c-3000-406c-8cc1-be093dc1de57
6cb62a0e-f24a-4874-980e-6f6a17de94b3	3461d1ba-93ee-4255-b744-c31afcc88870	f72d4d9c-3000-406c-8cc1-be093dc1de57
fcdfe3a5-9b98-4580-9c20-698f0582bbc8	0250c85a-8d59-4045-8103-1ecb5e030537	f72d4d9c-3000-406c-8cc1-be093dc1de57
f161e6fc-aa3d-46c2-b4b9-c8353dc5def3	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	f72d4d9c-3000-406c-8cc1-be093dc1de57
28f10ab5-80ee-4223-b0a9-331eb5036307	fd073c81-b291-482d-81fe-9730027ff33a	f72d4d9c-3000-406c-8cc1-be093dc1de57
b0002518-b1be-4eb4-b210-ea6ab9d706ae	ee5684cd-dc56-4e7f-818d-64a40135ee57	f72d4d9c-3000-406c-8cc1-be093dc1de57
0f45811a-24fd-4235-8bb7-175fb599d7de	32ca3d58-2527-4536-95d3-b0e1a68065e8	f72d4d9c-3000-406c-8cc1-be093dc1de57
aebfb6ff-37bd-4e6f-bebc-9e031a55722b	70b83387-b52d-4634-95cb-847a74ca6ea7	f72d4d9c-3000-406c-8cc1-be093dc1de57
0e82c06f-807b-4dbb-b58d-f3d2f535843b	f8e35850-947d-41a7-a2a1-84bc08785a92	f72d4d9c-3000-406c-8cc1-be093dc1de57
0e7163aa-cf93-48cf-91af-eb08f74d93dc	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	f72d4d9c-3000-406c-8cc1-be093dc1de57
ac29f2dc-465b-4a11-b127-5e6f9bec0824	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	f72d4d9c-3000-406c-8cc1-be093dc1de57
3ec2a5bb-22bf-4f2b-a2a6-cccfac810b39	e1668d3f-1c54-4f8e-80c8-2978206232ae	f72d4d9c-3000-406c-8cc1-be093dc1de57
bc8d11c5-2ef2-4dd1-842e-a4e59d1e47d6	4f87f3de-0452-45ad-8dbb-598e58b27d81	f72d4d9c-3000-406c-8cc1-be093dc1de57
46047ee1-32b1-4e6d-9c9b-4e41cd17ee92	e06741c9-66c3-40a8-a253-7c54413a8a93	f72d4d9c-3000-406c-8cc1-be093dc1de57
f4ab9507-a71a-4c1b-9267-fe3500d16aaf	984dab09-fbc5-4954-a2a9-c259911413fe	f72d4d9c-3000-406c-8cc1-be093dc1de57
bd192042-dae0-441e-b10f-3979765710e7	f237f8ee-4610-4d33-ac93-c07f59233888	f72d4d9c-3000-406c-8cc1-be093dc1de57
2f5455ff-c027-4ea6-8295-6f90945a7aff	ea15fc00-7111-46df-9624-bf7d6b1fc057	f72d4d9c-3000-406c-8cc1-be093dc1de57
a7cc9551-db0b-4e61-835d-f714808733ad	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	f72d4d9c-3000-406c-8cc1-be093dc1de57
0cf7d329-0dcc-4a85-97e5-8663763167f7	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	f72d4d9c-3000-406c-8cc1-be093dc1de57
74d30e2c-5d3e-4765-a20c-905dabce1175	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	f72d4d9c-3000-406c-8cc1-be093dc1de57
13bb9fdc-e8dc-490f-96e4-6e05908ca6d7	51ffddf7-dd3a-4f80-9096-5cfd709846e2	a8dbd99e-f577-4d18-b146-861aeb1197ee
432b0bec-b815-4d91-ba6b-570ccaa9a638	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	a8dbd99e-f577-4d18-b146-861aeb1197ee
697db725-96bd-46b6-8214-e20b495a1cf8	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	a8dbd99e-f577-4d18-b146-861aeb1197ee
52e84644-33fa-4079-99a3-0ba7ad58df3e	f3c7b348-1234-42d8-94ad-8490df57863a	a8dbd99e-f577-4d18-b146-861aeb1197ee
e7a6fa29-a3cf-4cf6-a239-2719231d8cb9	ae780740-6d72-41ca-9ea9-81ba82c1f662	a8dbd99e-f577-4d18-b146-861aeb1197ee
0b86347a-0f09-4b1a-b642-c5318368f39a	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	a8dbd99e-f577-4d18-b146-861aeb1197ee
217ff8b8-3541-4f27-afb5-2f5af895b050	17deaf36-d2f5-4c45-af32-94d207a5f69d	a8dbd99e-f577-4d18-b146-861aeb1197ee
46b688e9-01fc-4701-8e39-06dc875b6484	b53daec8-b909-4268-9211-0323217aba95	a8dbd99e-f577-4d18-b146-861aeb1197ee
f4aba353-6d7d-43a2-ab96-9a32aba64181	c163cd2f-ffc1-4096-84b6-407547820de6	a8dbd99e-f577-4d18-b146-861aeb1197ee
1226f2dc-c4fc-473d-9ac4-4bc2019a36cf	c3baacd5-6a2c-4568-87d3-b1412ec697d4	a8dbd99e-f577-4d18-b146-861aeb1197ee
575fb3d9-d8e8-4c16-8ecc-ba9ed08e6a92	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	a8dbd99e-f577-4d18-b146-861aeb1197ee
b50c673e-0ace-4364-bf6c-e2653eba7690	50248627-b1ee-4a7e-b277-030d6630d5de	a8dbd99e-f577-4d18-b146-861aeb1197ee
8309d994-6fa1-4ae3-a474-da692cbfe4c7	4ce1e015-14b2-4457-8e03-c0f827ee81da	a8dbd99e-f577-4d18-b146-861aeb1197ee
f820f7f5-1b11-4e93-b040-2f5f84333a43	1dae37f3-a38d-4a6e-a1cb-3997624e4172	a8dbd99e-f577-4d18-b146-861aeb1197ee
7568efa7-a6ac-401f-b86f-7cadfc66d239	47caa164-b374-44ea-a106-4bb4fd669148	a8dbd99e-f577-4d18-b146-861aeb1197ee
4388a427-7d28-4739-bbab-4dc9dada9e22	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	a8dbd99e-f577-4d18-b146-861aeb1197ee
3d0ae0a3-3b3b-466c-9ee3-a3cbdca10046	c5a9766d-4162-4a24-b7fb-df0c5107bca2	a8dbd99e-f577-4d18-b146-861aeb1197ee
4f29ac7b-7632-4046-9cf9-a06fbe2cd967	e75bebe3-f0be-4c97-9362-080110ae7ed7	a8dbd99e-f577-4d18-b146-861aeb1197ee
ad0208d3-fdd2-42e5-9ebf-29cb2075e86d	55ee460d-7d0c-4de9-9cda-04e1be396e9d	a8dbd99e-f577-4d18-b146-861aeb1197ee
3159de3e-bcd9-4f86-87f4-391042e811d3	78080f63-ca42-4303-a261-4641a275237f	a8dbd99e-f577-4d18-b146-861aeb1197ee
6e7d902a-476b-49d9-a114-68cc0afabab8	ad4288c3-dc75-46e2-b727-71f2e8a57099	a8dbd99e-f577-4d18-b146-861aeb1197ee
f3f5fef5-3512-42cc-9197-a45d49ffc63b	3f12f2f7-76b4-4981-900e-d12336f9ae23	a8dbd99e-f577-4d18-b146-861aeb1197ee
6261d27c-4ded-4ff2-a718-35ea42a400c6	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	a8dbd99e-f577-4d18-b146-861aeb1197ee
ff5a2aa5-b898-4ac2-b206-959172346677	91da7ef2-f322-4fab-b845-9cb701e848aa	a8dbd99e-f577-4d18-b146-861aeb1197ee
2aced9ac-b9a9-4b5c-ab78-5e50927b5394	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	a8dbd99e-f577-4d18-b146-861aeb1197ee
f4d6dd77-0d6f-41d7-a072-5d0a19684cef	a8d71a94-a068-4d50-87d8-cbfca70d2c29	a8dbd99e-f577-4d18-b146-861aeb1197ee
6f5c472d-9f33-4ccf-92ed-21ca96f3d89a	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	a8dbd99e-f577-4d18-b146-861aeb1197ee
ac614335-fbe4-4053-b44e-b7ee2e4ed377	3461d1ba-93ee-4255-b744-c31afcc88870	a8dbd99e-f577-4d18-b146-861aeb1197ee
a368edcf-de57-4e0c-b6b2-3b4355e299ee	0250c85a-8d59-4045-8103-1ecb5e030537	a8dbd99e-f577-4d18-b146-861aeb1197ee
e2f39f9e-1f18-401b-918a-51ba4e8800d3	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	a8dbd99e-f577-4d18-b146-861aeb1197ee
4e2ce608-b7d3-437e-ac06-9b746587da20	fd073c81-b291-482d-81fe-9730027ff33a	a8dbd99e-f577-4d18-b146-861aeb1197ee
f5f45728-8862-445e-8ad4-7d27afb3e25b	ee5684cd-dc56-4e7f-818d-64a40135ee57	a8dbd99e-f577-4d18-b146-861aeb1197ee
4c2e06a0-2181-49a8-aece-48c5fc03fc53	32ca3d58-2527-4536-95d3-b0e1a68065e8	a8dbd99e-f577-4d18-b146-861aeb1197ee
df3d1b04-ead3-49b4-b53a-f4f04d17dd3f	70b83387-b52d-4634-95cb-847a74ca6ea7	a8dbd99e-f577-4d18-b146-861aeb1197ee
134fa6b9-3681-4e1b-bb9d-64925f4306b3	f8e35850-947d-41a7-a2a1-84bc08785a92	a8dbd99e-f577-4d18-b146-861aeb1197ee
bfd4d18d-0697-47fe-9d42-4290a4123863	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	a8dbd99e-f577-4d18-b146-861aeb1197ee
98feb434-671a-4701-a3a6-3e9d9bf627c9	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	a8dbd99e-f577-4d18-b146-861aeb1197ee
ac3a3c3c-5b38-444f-afb4-2344fa8a5a90	e1668d3f-1c54-4f8e-80c8-2978206232ae	a8dbd99e-f577-4d18-b146-861aeb1197ee
62deb131-a8ea-4954-b10f-502eb0318103	4f87f3de-0452-45ad-8dbb-598e58b27d81	a8dbd99e-f577-4d18-b146-861aeb1197ee
be71439d-da83-40bb-994a-73435a35ddd6	e06741c9-66c3-40a8-a253-7c54413a8a93	a8dbd99e-f577-4d18-b146-861aeb1197ee
228323f1-8a52-404b-b9b9-ef74f32f727a	984dab09-fbc5-4954-a2a9-c259911413fe	a8dbd99e-f577-4d18-b146-861aeb1197ee
6805fd31-5329-4134-aa0b-524d9b928816	f237f8ee-4610-4d33-ac93-c07f59233888	a8dbd99e-f577-4d18-b146-861aeb1197ee
06ebbb6a-2ea9-4be4-99e1-2c2bbfc35dda	ea15fc00-7111-46df-9624-bf7d6b1fc057	a8dbd99e-f577-4d18-b146-861aeb1197ee
d357f2b6-b95a-4ce6-93c4-74ebcaeff4ba	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	a8dbd99e-f577-4d18-b146-861aeb1197ee
8bd727ca-c7d2-4b11-aec8-72f570287eed	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	a8dbd99e-f577-4d18-b146-861aeb1197ee
b5763244-653d-4169-8950-70ca616c1750	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	a8dbd99e-f577-4d18-b146-861aeb1197ee
b9aef205-509d-4843-900b-13f1ce821478	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	7b1e23af-ba06-482e-a09b-41376eef3061
e5c5b147-0245-4512-9419-6f507c7959dc	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	7b1e23af-ba06-482e-a09b-41376eef3061
e2ace4bd-378e-4b34-aa97-8e02bf339ef9	f3c7b348-1234-42d8-94ad-8490df57863a	7b1e23af-ba06-482e-a09b-41376eef3061
239e958a-2052-4d10-a4ab-8cd06b4ce0b7	ae780740-6d72-41ca-9ea9-81ba82c1f662	7b1e23af-ba06-482e-a09b-41376eef3061
6d4cb41f-b1cf-4387-a8bb-d61f5c35638a	5626819b-94a7-4ce9-8a5a-48713c0ecb0d	7b1e23af-ba06-482e-a09b-41376eef3061
4e072700-0ba1-4dc4-bb88-be2d6aabd1c2	17deaf36-d2f5-4c45-af32-94d207a5f69d	7b1e23af-ba06-482e-a09b-41376eef3061
aa063a0d-6e96-466f-9ce9-75f3a3340236	b53daec8-b909-4268-9211-0323217aba95	7b1e23af-ba06-482e-a09b-41376eef3061
c266bca7-0263-4768-b95f-1c79fa347c1d	c163cd2f-ffc1-4096-84b6-407547820de6	7b1e23af-ba06-482e-a09b-41376eef3061
d7fc8699-8172-4e0d-9983-17c88d00be15	c3baacd5-6a2c-4568-87d3-b1412ec697d4	7b1e23af-ba06-482e-a09b-41376eef3061
81434341-a17f-4dad-806b-cf97d4d39383	1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	7b1e23af-ba06-482e-a09b-41376eef3061
e798a15f-0bee-44b2-bff2-3ab9b9281a42	50248627-b1ee-4a7e-b277-030d6630d5de	7b1e23af-ba06-482e-a09b-41376eef3061
cfeebc20-e83f-4878-98ba-0869e9a313d0	4ce1e015-14b2-4457-8e03-c0f827ee81da	7b1e23af-ba06-482e-a09b-41376eef3061
8edafb60-7b14-4952-b00c-ab08fd9338e7	a95cd978-e8f5-4094-9601-1129fd48c178	7b1e23af-ba06-482e-a09b-41376eef3061
10b292a6-4816-477e-a61e-ee8ef847a700	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	7b1e23af-ba06-482e-a09b-41376eef3061
24ebe915-8634-4ef6-bfb3-0cf7ca274cd5	2253584c-f96c-49b8-8205-ad4d9742f135	7b1e23af-ba06-482e-a09b-41376eef3061
476321f2-ae8d-4699-a133-701461e4af1b	1dae37f3-a38d-4a6e-a1cb-3997624e4172	7b1e23af-ba06-482e-a09b-41376eef3061
e4b11b02-ce41-448b-bada-bf5b353a6b90	47caa164-b374-44ea-a106-4bb4fd669148	7b1e23af-ba06-482e-a09b-41376eef3061
6db791e7-fffb-4db3-b3af-ce6446953e6a	50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	7b1e23af-ba06-482e-a09b-41376eef3061
812bd09d-10b5-4a92-b367-eb874ebd34e1	c5a9766d-4162-4a24-b7fb-df0c5107bca2	7b1e23af-ba06-482e-a09b-41376eef3061
5a2e98b9-681d-4113-a8e0-e01a5f86f90c	e75bebe3-f0be-4c97-9362-080110ae7ed7	7b1e23af-ba06-482e-a09b-41376eef3061
e9b1b9c6-9286-41d1-a278-8eb8efe00891	55ee460d-7d0c-4de9-9cda-04e1be396e9d	7b1e23af-ba06-482e-a09b-41376eef3061
0a6bc94b-f53c-4224-b793-13f0f7168fe8	78080f63-ca42-4303-a261-4641a275237f	7b1e23af-ba06-482e-a09b-41376eef3061
1f859c6e-6e7c-4e44-a61f-096be528587c	ad4288c3-dc75-46e2-b727-71f2e8a57099	7b1e23af-ba06-482e-a09b-41376eef3061
e3d68cce-bd62-47d2-a6a7-3bce3fa2953a	3f12f2f7-76b4-4981-900e-d12336f9ae23	7b1e23af-ba06-482e-a09b-41376eef3061
b47d059e-f5b3-4d7a-8a0b-a68a54f80b91	a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	7b1e23af-ba06-482e-a09b-41376eef3061
6aac049d-dd26-4af3-ac78-e6ef0ae61eb1	91da7ef2-f322-4fab-b845-9cb701e848aa	7b1e23af-ba06-482e-a09b-41376eef3061
af8a7528-0838-47f9-b085-693b70fe56a1	5fd77ee7-d3bf-4ea6-a7d2-046209cba948	7b1e23af-ba06-482e-a09b-41376eef3061
756add0f-827b-4b8b-b9c5-466464fce8ba	a8d71a94-a068-4d50-87d8-cbfca70d2c29	7b1e23af-ba06-482e-a09b-41376eef3061
199b5362-ce0a-4e73-a19c-2b000e565bb1	9f34dfd1-129f-4cbe-bfad-5083ff4cc087	7b1e23af-ba06-482e-a09b-41376eef3061
401687aa-ce75-406c-bea5-f0b714c55811	3461d1ba-93ee-4255-b744-c31afcc88870	7b1e23af-ba06-482e-a09b-41376eef3061
b6cf2bdf-7751-4e0a-8a6d-cf586d3a3c08	0250c85a-8d59-4045-8103-1ecb5e030537	7b1e23af-ba06-482e-a09b-41376eef3061
d7a76470-ef6e-4928-b722-58cc508e010e	c314b0c1-850e-4ccb-b9b4-537cc596d6dd	7b1e23af-ba06-482e-a09b-41376eef3061
3a3477a0-9579-4b6f-8720-8326ab5aaba9	fd073c81-b291-482d-81fe-9730027ff33a	7b1e23af-ba06-482e-a09b-41376eef3061
1846a36f-5f8a-4f8f-adfa-0e209388f367	ee5684cd-dc56-4e7f-818d-64a40135ee57	7b1e23af-ba06-482e-a09b-41376eef3061
0e648b75-c356-40bc-ae67-0d0652e43b1e	32ca3d58-2527-4536-95d3-b0e1a68065e8	7b1e23af-ba06-482e-a09b-41376eef3061
8014ddd8-9b71-41bc-a3a9-c947460b7bce	70b83387-b52d-4634-95cb-847a74ca6ea7	7b1e23af-ba06-482e-a09b-41376eef3061
fc220f7e-1fcd-429b-b041-715f58606909	f8e35850-947d-41a7-a2a1-84bc08785a92	7b1e23af-ba06-482e-a09b-41376eef3061
229e19bc-2a88-4c0b-b2ba-705d641f3a22	1ec105a7-3c30-4f1d-b653-a5a49ba954b6	7b1e23af-ba06-482e-a09b-41376eef3061
5c7bd6e3-04f9-4a91-afb3-98e302124894	2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	7b1e23af-ba06-482e-a09b-41376eef3061
f9f2383f-ca75-4355-9293-428a1294e67a	e1668d3f-1c54-4f8e-80c8-2978206232ae	7b1e23af-ba06-482e-a09b-41376eef3061
83439b19-4c88-4411-ba0d-70c8b4051c7d	4f87f3de-0452-45ad-8dbb-598e58b27d81	7b1e23af-ba06-482e-a09b-41376eef3061
8abadb22-f5cd-4817-a981-6abf06750b53	e06741c9-66c3-40a8-a253-7c54413a8a93	7b1e23af-ba06-482e-a09b-41376eef3061
dc7a80b2-94a6-4447-aaf9-56ec3783cdf6	984dab09-fbc5-4954-a2a9-c259911413fe	7b1e23af-ba06-482e-a09b-41376eef3061
ab29a36d-2672-469e-bfde-f570a6b4622c	f237f8ee-4610-4d33-ac93-c07f59233888	7b1e23af-ba06-482e-a09b-41376eef3061
52c3dc76-82d6-43e7-9c09-818c7cccaef7	ea15fc00-7111-46df-9624-bf7d6b1fc057	7b1e23af-ba06-482e-a09b-41376eef3061
f3fa8d3a-47d3-4ab6-8ece-53b97b660ecd	d4232bf4-594a-4e6e-80fd-a64f447a2a7f	7b1e23af-ba06-482e-a09b-41376eef3061
7f2fc103-ceb3-481b-bd3b-208b7da9e328	76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	7b1e23af-ba06-482e-a09b-41376eef3061
f9617d36-005c-4f0a-b5f0-8e4028988aab	8249dc22-68bb-4861-b0e8-a58b0c79cd9a	7b1e23af-ba06-482e-a09b-41376eef3061
f0c613a2-c0c5-453b-b351-2045ff0029c1	268cd00c-dad9-40f7-9d91-d04d374de71d	26a9b4ca-f968-423b-ae26-c3d2e2692446
edd8ab0f-0e64-4d89-b9d5-24e36a0a51a0	268cd00c-dad9-40f7-9d91-d04d374de71d	d22c4428-8508-4dd2-8f38-7ce189a5609f
2b3b5e93-89a6-4488-bf4f-984b262353c3	268cd00c-dad9-40f7-9d91-d04d374de71d	657480ca-7532-4af1-a318-da2913479a0e
e24d1341-041f-4a8d-b555-dadf80180714	268cd00c-dad9-40f7-9d91-d04d374de71d	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
bab8397d-2f77-4991-817a-1bd59eb7a19a	268cd00c-dad9-40f7-9d91-d04d374de71d	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
a32a11ad-2f2b-479c-9cf8-ba129e62155f	268cd00c-dad9-40f7-9d91-d04d374de71d	072c8a4f-d84d-45fc-af2a-1f0186742e29
c68143c6-c884-497e-8a1a-f06fee7cdf1c	268cd00c-dad9-40f7-9d91-d04d374de71d	f72d4d9c-3000-406c-8cc1-be093dc1de57
7b434777-c3a2-490c-b546-c4d74da81000	268cd00c-dad9-40f7-9d91-d04d374de71d	7b1e23af-ba06-482e-a09b-41376eef3061
430a39b6-af58-4bb2-b49c-dbd311e719a4	268cd00c-dad9-40f7-9d91-d04d374de71d	a8dbd99e-f577-4d18-b146-861aeb1197ee
8c6eaf0e-b654-409f-b610-e6ff4ac44599	32be656f-810d-49ef-9c67-af54895403a6	26a9b4ca-f968-423b-ae26-c3d2e2692446
fdd66b7b-21a6-46a9-8875-5c419dd5325e	32be656f-810d-49ef-9c67-af54895403a6	a8dbd99e-f577-4d18-b146-861aeb1197ee
8a7f6030-aef0-424a-afe5-2051d83c8efb	32be656f-810d-49ef-9c67-af54895403a6	072c8a4f-d84d-45fc-af2a-1f0186742e29
4127a9b5-58fc-44a8-acfb-2c155a88df42	32be656f-810d-49ef-9c67-af54895403a6	657480ca-7532-4af1-a318-da2913479a0e
c133b7d4-7d9a-44b2-8a14-6852ecd73704	32be656f-810d-49ef-9c67-af54895403a6	d22c4428-8508-4dd2-8f38-7ce189a5609f
2c31e1f8-fe63-4ceb-96e9-b39f9dfb44b9	32be656f-810d-49ef-9c67-af54895403a6	f72d4d9c-3000-406c-8cc1-be093dc1de57
fea1cf59-4dd5-42eb-9de3-84a13734d51d	32be656f-810d-49ef-9c67-af54895403a6	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
82f9d727-1c97-4e0c-8acc-751cea916320	32be656f-810d-49ef-9c67-af54895403a6	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
4cfca17d-84b6-4709-8d13-5626e48e40c0	32be656f-810d-49ef-9c67-af54895403a6	7b1e23af-ba06-482e-a09b-41376eef3061
942cfaf0-2cc2-4bce-be5b-e35944e10063	32be656f-810d-49ef-9c67-af54895403a6	8aae2daa-5961-4663-a346-89df54ffc405
7e1987a6-61a1-4500-8b56-0b462329a0ba	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	7b1e23af-ba06-482e-a09b-41376eef3061
aad8300f-37a2-453a-a5fb-36652498d6b2	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	a8dbd99e-f577-4d18-b146-861aeb1197ee
d5f85347-3af8-434c-98ab-db7106eed396	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	072c8a4f-d84d-45fc-af2a-1f0186742e29
49e90e18-3778-4d6b-a4a5-3291ebd0d96b	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	d22c4428-8508-4dd2-8f38-7ce189a5609f
17d86e9b-7a9a-4d45-9384-e436e36a2a9f	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	657480ca-7532-4af1-a318-da2913479a0e
70cab17c-660c-4b82-be30-64def56492c2	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	f72d4d9c-3000-406c-8cc1-be093dc1de57
2b5770c5-eaaf-49bd-8ebc-a271d1f56b70	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
938f0b2e-185f-4d45-9b04-ee7a403b0cf2	33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
749b6673-7d4d-4024-b13f-d5dee06905b0	f41c090a-fa90-4643-8c7b-34dc7493ded1	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
e13b68d6-47a1-477a-8dbd-fa43731c3c53	f41c090a-fa90-4643-8c7b-34dc7493ded1	657480ca-7532-4af1-a318-da2913479a0e
bdfd3b67-2c73-410e-b244-f868151127d1	8baea0eb-0064-41b8-bd22-0c89d95929a6	7b1e23af-ba06-482e-a09b-41376eef3061
d29405e0-42a6-4895-90aa-db2539bdc9a4	8baea0eb-0064-41b8-bd22-0c89d95929a6	a8dbd99e-f577-4d18-b146-861aeb1197ee
fbd4bd04-2348-4558-8bf0-3dfb67897244	8baea0eb-0064-41b8-bd22-0c89d95929a6	f72d4d9c-3000-406c-8cc1-be093dc1de57
d204b87c-df19-42fd-a97f-19c9cd3b292c	8baea0eb-0064-41b8-bd22-0c89d95929a6	072c8a4f-d84d-45fc-af2a-1f0186742e29
0b4795ed-8904-45e2-b49d-c902afa27ac1	8baea0eb-0064-41b8-bd22-0c89d95929a6	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
fd6046dd-30e6-48c1-a5fc-cdd5264e47ea	8baea0eb-0064-41b8-bd22-0c89d95929a6	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
c9247e90-14a3-4168-bf0b-4dfeb213f9d3	8baea0eb-0064-41b8-bd22-0c89d95929a6	657480ca-7532-4af1-a318-da2913479a0e
e87b4d39-187c-4571-9f43-6e7c08e02d26	8baea0eb-0064-41b8-bd22-0c89d95929a6	d22c4428-8508-4dd2-8f38-7ce189a5609f
5d51a9e7-ac3c-4ed4-99d9-90ddb24af818	8baea0eb-0064-41b8-bd22-0c89d95929a6	26a9b4ca-f968-423b-ae26-c3d2e2692446
fd09828b-ebd2-401c-8d80-55ebed5f13eb	72cf67bd-7d1f-4952-8013-75b0ad7f4677	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
5bb24900-28cf-41aa-979f-9e67f8b60822	72cf67bd-7d1f-4952-8013-75b0ad7f4677	7b1e23af-ba06-482e-a09b-41376eef3061
7671a969-a0d2-4ba7-84d2-944797133695	72cf67bd-7d1f-4952-8013-75b0ad7f4677	a8dbd99e-f577-4d18-b146-861aeb1197ee
7fc17fbe-d234-471b-8697-29fac4d238d2	72cf67bd-7d1f-4952-8013-75b0ad7f4677	f72d4d9c-3000-406c-8cc1-be093dc1de57
387b9064-fc80-4d33-b198-991aaae1eac9	72cf67bd-7d1f-4952-8013-75b0ad7f4677	072c8a4f-d84d-45fc-af2a-1f0186742e29
b199c2e3-a861-438c-9a9e-2b48e7dd5090	72cf67bd-7d1f-4952-8013-75b0ad7f4677	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
4389302e-0177-40ab-8460-bec7084602fb	72cf67bd-7d1f-4952-8013-75b0ad7f4677	657480ca-7532-4af1-a318-da2913479a0e
96740cc2-f468-421c-99bd-59f5d3441ba8	72cf67bd-7d1f-4952-8013-75b0ad7f4677	d22c4428-8508-4dd2-8f38-7ce189a5609f
fa50a5df-4fd2-4cc3-bbc6-3b833c174099	72cf67bd-7d1f-4952-8013-75b0ad7f4677	26a9b4ca-f968-423b-ae26-c3d2e2692446
59523e06-7d90-448b-b231-a4ba14a85d8f	71563a65-7aa9-4d3e-9c2c-814e73d6e176	7b1e23af-ba06-482e-a09b-41376eef3061
22afef3b-8c2b-4a5f-b1dc-1458be745777	71563a65-7aa9-4d3e-9c2c-814e73d6e176	a8dbd99e-f577-4d18-b146-861aeb1197ee
500b9ded-097b-4cf0-9860-e5a2ffb11277	71563a65-7aa9-4d3e-9c2c-814e73d6e176	f72d4d9c-3000-406c-8cc1-be093dc1de57
dbc608d5-9c24-47b1-83e7-a6d95cd9c2dc	71563a65-7aa9-4d3e-9c2c-814e73d6e176	072c8a4f-d84d-45fc-af2a-1f0186742e29
35482565-b48f-427f-9a1d-729783092bb2	71563a65-7aa9-4d3e-9c2c-814e73d6e176	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
d3111e88-9a17-4577-bba4-8bdf078ee7aa	71563a65-7aa9-4d3e-9c2c-814e73d6e176	657480ca-7532-4af1-a318-da2913479a0e
72ce7d82-8610-49c6-8c9b-afe30b865c6a	71563a65-7aa9-4d3e-9c2c-814e73d6e176	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
1089b2a1-018b-4699-a963-49f96d5d8112	71563a65-7aa9-4d3e-9c2c-814e73d6e176	d22c4428-8508-4dd2-8f38-7ce189a5609f
69760389-7a90-4fc0-b59a-e8a85a93b267	71563a65-7aa9-4d3e-9c2c-814e73d6e176	26a9b4ca-f968-423b-ae26-c3d2e2692446
dd6349b8-151c-4f79-a5cb-96bbcae59980	1bbfe617-85b0-471b-aaa3-32f7778898f1	7b1e23af-ba06-482e-a09b-41376eef3061
809ff242-bc31-4d72-853e-5fb5e175f9e6	1bbfe617-85b0-471b-aaa3-32f7778898f1	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
687cb6a4-3686-4996-afbd-81ca00422ce5	1bbfe617-85b0-471b-aaa3-32f7778898f1	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
107f28ae-4d02-474d-a2b2-a48b1ba56954	1bbfe617-85b0-471b-aaa3-32f7778898f1	f72d4d9c-3000-406c-8cc1-be093dc1de57
28120777-a11e-4eff-9de5-e9ebbbdb2cfc	1bbfe617-85b0-471b-aaa3-32f7778898f1	657480ca-7532-4af1-a318-da2913479a0e
26aae315-941b-411f-a767-17b09b060d8d	1bbfe617-85b0-471b-aaa3-32f7778898f1	d22c4428-8508-4dd2-8f38-7ce189a5609f
31ea095a-9010-4ee1-a32c-b13153ee5355	1bbfe617-85b0-471b-aaa3-32f7778898f1	072c8a4f-d84d-45fc-af2a-1f0186742e29
1989fc3a-a7cd-4b97-b972-e8b1c7cce9e6	1bbfe617-85b0-471b-aaa3-32f7778898f1	a8dbd99e-f577-4d18-b146-861aeb1197ee
00890433-f048-4412-83f4-9df5b7b96241	1bbfe617-85b0-471b-aaa3-32f7778898f1	26a9b4ca-f968-423b-ae26-c3d2e2692446
ca1b83e0-ae8c-4118-91d9-993f69b9ea8b	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	7b1e23af-ba06-482e-a09b-41376eef3061
d022633a-46dc-486b-825d-840854b2640a	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	a8dbd99e-f577-4d18-b146-861aeb1197ee
876ecfaa-dd72-4df4-92f3-4f93d23d3b31	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	f72d4d9c-3000-406c-8cc1-be093dc1de57
53d683fd-cac7-4c87-962a-4267f1c0f0a1	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	072c8a4f-d84d-45fc-af2a-1f0186742e29
fe4c4fb5-2cd9-4e06-86ba-dbac3a2b0652	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	8768ff0e-8105-4d94-9a44-53ef05b7b4e7
6f2538cf-9ac7-43b2-94ef-050cd4eead65	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	a7bd4dfb-342a-4f8b-86c0-6a9dc1dcd308
94ae8131-9014-457b-a5b2-40cc17b34c90	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	657480ca-7532-4af1-a318-da2913479a0e
a30b75bb-f501-462a-9160-454508696538	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	d22c4428-8508-4dd2-8f38-7ce189a5609f
7d3ee4d4-7ad2-4983-ae37-43b4c9119f3e	d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	26a9b4ca-f968-423b-ae26-c3d2e2692446
986d47f6-786f-4ba1-8561-14ceb55942c4	5613458c-6238-4943-b332-ff7aa8f845c7	deec55d1-a711-472e-a229-57747b6eb403
e5b6e4a7-231d-445f-a3e2-3c135279ea49	5613458c-6238-4943-b332-ff7aa8f845c7	2fdc9afc-9716-4685-9dbe-61fa7ee00463
f662d6c6-88b8-44db-8c29-e84eed89e42f	5613458c-6238-4943-b332-ff7aa8f845c7	d22c4428-8508-4dd2-8f38-7ce189a5609f
88ad20de-33d5-4aac-bea1-b6d454f2199b	5613458c-6238-4943-b332-ff7aa8f845c7	a8dbd99e-f577-4d18-b146-861aeb1197ee
3d1bd1f6-ef48-4f57-a354-0b2142b7eea6	5613458c-6238-4943-b332-ff7aa8f845c7	8aae2daa-5961-4663-a346-89df54ffc405
\.


--
-- Data for Name: room_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_images (id, "roomId", url, caption, "isPrimary", "order", "createdAt") FROM stdin;
396bebdf-600b-40e2-b8fa-b6022be855be	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956655/iris-plaza/rooms/cidcabzjklxskkfwoblb.mp4	ROOM_VIDEO	f	0	2026-03-19 21:44:20.773
98e57b90-f33f-40de-8c32-55092003d78c	2253584c-f96c-49b8-8205-ad4d9742f135	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956780/iris-plaza/rooms/rlobgd7jlwwyqsacxq9u.mp4	ROOM_VIDEO	f	0	2026-03-19 21:46:25.915
6b106002-af68-4408-99a7-6644a3041569	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957011/iris-plaza/rooms/vzbebybezwjrabnwxyfw.mp4	ROOM_VIDEO	f	0	2026-03-19 21:50:16.388
2a335f93-df5e-4e0b-a579-80ecbeb5a538	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957093/iris-plaza/rooms/yah8zvkpcnzymshvu3mg.mp4	ROOM_VIDEO	f	0	2026-03-19 21:51:38.845
6375bbac-ca6b-4d5d-947b-c309b5c30606	febfdbc4-874a-459c-8309-6ee0f7b96a8e	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774710467/iris-plaza/rooms/aketolrlddlaljnn7xno.jpg	\N	f	0	2026-03-28 15:08:03.769
aaecedf6-bc16-44bd-a629-0dff68a1252b	febfdbc4-874a-459c-8309-6ee0f7b96a8e	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1774710478/iris-plaza/rooms/h1czqvxxtfdmynp5qe6q.mp4	ROOM_VIDEO	f	1	2026-03-28 15:08:03.769
eb3944e8-bc81-422d-aa19-07c02a6d59bb	5613458c-6238-4943-b332-ff7aa8f845c7	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1775211458/iris-plaza/rooms/ewyqycok1njqn3nvotob.mp4	ROOM_VIDEO	f	0	2026-04-03 10:19:43.576
b579e0a8-4438-4fc2-ba43-f9e3a99bfa64	5613458c-6238-4943-b332-ff7aa8f845c7	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775211577/iris-plaza/rooms/h5ynu7xsq9atkridsqaf.png	\N	f	1	2026-04-03 10:19:43.576
\.


--
-- Data for Name: room_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_media (id, "roomId", type, url, "createdAt") FROM stdin;
fb03230c-26d6-4188-80cb-153810a7afc0	c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956655/iris-plaza/rooms/cidcabzjklxskkfwoblb.mp4	2026-03-19 21:44:30.696
2fc33603-2861-4525-8e4f-1d258325154e	2253584c-f96c-49b8-8205-ad4d9742f135	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956780/iris-plaza/rooms/rlobgd7jlwwyqsacxq9u.mp4	2026-03-19 21:46:37.57
fb84b0ba-c150-40d5-a9a3-349f0f5bb750	ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957011/iris-plaza/rooms/vzbebybezwjrabnwxyfw.mp4	2026-03-19 21:50:25.266
29eac046-c177-4251-be50-97b524366586	3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957093/iris-plaza/rooms/yah8zvkpcnzymshvu3mg.mp4	2026-03-19 21:51:47.952
4729159b-11ab-45a8-bedb-5a9411d85070	febfdbc4-874a-459c-8309-6ee0f7b96a8e	image	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1774710467/iris-plaza/rooms/aketolrlddlaljnn7xno.jpg	2026-03-28 15:08:12.387
e1364336-31ae-420a-a893-612bb6fa52dd	febfdbc4-874a-459c-8309-6ee0f7b96a8e	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1774710478/iris-plaza/rooms/h1czqvxxtfdmynp5qe6q.mp4	2026-03-28 15:08:12.387
92d0e0d6-2772-45c8-99c9-8de4c88e826e	5613458c-6238-4943-b332-ff7aa8f845c7	video	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1775211458/iris-plaza/rooms/ewyqycok1njqn3nvotob.mp4	2026-04-03 10:19:43.593
437df2d0-f8d9-4f0a-93a1-5899c3371747	5613458c-6238-4943-b332-ff7aa8f845c7	image	https://res.cloudinary.com/dtcp8qhoy/image/upload/v1775211577/iris-plaza/rooms/h5ynu7xsq9atkridsqaf.png	2026-04-03 10:19:43.593
\.


--
-- Data for Name: room_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_rules (id, room_id, rule) FROM stdin;
\.


--
-- Data for Name: room_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_transfers (id, booking_id, user_id, from_room_id, to_room_id, effective_date, desired_move_out_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, name, type, description, floor, area, rent, deposit, status, "isAvailable", "occupiedFrom", "occupiedUntil", "availableAt", "videoUrl", "createdAt", "updatedAt", "deletedAt", "managementIsAvailable", "managementOccupiedUntil", "managementRent", "managementStatus") FROM stdin;
febfdbc4-874a-459c-8309-6ee0f7b96a8e	dilux	ONE_BHK	hevx ebx3wieh	1	450	20000.00	12000.00	AVAILABLE	t	\N	\N	\N	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1774710478/iris-plaza/rooms/h1czqvxxtfdmynp5qe6q.mp4	2026-03-28 15:08:03.769	2026-03-30 07:16:20.679	2026-03-30 07:15:51.907	t	\N	\N	AVAILABLE
3dbfdd30-1fa5-4e5a-8b60-37f6559a674b	Room 409	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-07-01 00:00:00	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957093/iris-plaza/rooms/yah8zvkpcnzymshvu3mg.mp4	2026-03-19 06:02:19.133	2026-03-19 21:51:38.845	\N	t	\N	\N	AVAILABLE
51ffddf7-dd3a-4f80-9096-5cfd709846e2	room 101	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 12:52:49.18	2026-11-30 00:00:00	2026-12-01 00:00:00	\N	2026-03-18 19:14:43.842	2026-03-19 10:11:54.613	2026-03-19 10:11:54.611	t	\N	\N	AVAILABLE
f3c7b348-1234-42d8-94ad-8490df57863a	Room 103	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-02-02 00:00:00	2027-03-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:23:09.974	\N	t	\N	\N	AVAILABLE
ae780740-6d72-41ca-9ea9-81ba82c1f662	Room 104	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:24:16.361	\N	t	\N	\N	AVAILABLE
17deaf36-d2f5-4c45-af32-94d207a5f69d	Room 306	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:28:59.177	\N	t	\N	\N	AVAILABLE
5626819b-94a7-4ce9-8a5a-48713c0ecb0d	Room 105	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-07-31 00:00:00	2026-08-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
b53daec8-b909-4268-9211-0323217aba95	Room 412	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-04-04 00:00:00	2026-04-05 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
c163cd2f-ffc1-4096-84b6-407547820de6	Room 503	ONE_BHK	\N	5	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-12-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
c3baacd5-6a2c-4568-87d3-b1412ec697d4	Room 504	ONE_BHK	\N	5	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
1ac7b5c5-e404-4b4b-8e0d-bbc1917d1f57	Room 403	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-03-15 00:00:00	2027-03-16 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
50248627-b1ee-4a7e-b277-030d6630d5de	Room 404	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-06-30 00:00:00	2027-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
4ce1e015-14b2-4457-8e03-c0f827ee81da	Room 405	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-12-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
8baea0eb-0064-41b8-bd22-0c89d95929a6	Room 109	ONE_BHK	\N	1	450	19000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-08-01 00:00:00	2026-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-27 04:58:46.962	\N	t	\N	\N	AVAILABLE
a1c6844b-a16e-40dc-ac7c-a6c6431d20f2	Room 108	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-12-31 00:00:00	2027-01-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 12:36:49.258	\N	t	\N	\N	AVAILABLE
33ef8cb8-0c41-432d-b113-ba1e7e80fd1c	Room 205	TWO_BHK	2 seperate room with attached bathroom	2	900	29000.00	60000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-07-19 00:00:00	2026-07-20 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-21 07:58:47.108	\N	t	\N	\N	AVAILABLE
ad4288c3-dc75-46e2-b727-71f2e8a57099	Room 106	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-12-31 00:00:00	2027-01-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:25:40.836	\N	t	\N	\N	AVAILABLE
91da7ef2-f322-4fab-b845-9cb701e848aa	Room 110	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-04-30 00:00:00	2026-05-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:33:42.089	\N	t	\N	\N	AVAILABLE
5fd77ee7-d3bf-4ea6-a7d2-046209cba948	Room 111	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:34:15.874	\N	t	\N	\N	AVAILABLE
32be656f-810d-49ef-9c67-af54895403a6	Room 210	TWO_BHK	2 seperate room with attach bathroom	2	900	29000.00	60000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-07-01 00:00:00	2026-07-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:39:28.401	\N	t	\N	\N	AVAILABLE
78080f63-ca42-4303-a261-4641a275237f	Room 302	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	\N	2026-12-31 00:00:00	2026-01-08 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:24:34.263	\N	t	\N	\N	AVAILABLE
f41c090a-fa90-4643-8c7b-34dc7493ded1	Room 115	ONE_BHK	bnm,./	1	450	20000.00	50000.00	AVAILABLE	t	\N	\N	\N	\N	2026-03-24 11:58:23.145	2026-03-24 15:26:26.196	2026-03-24 12:38:26.819	t	\N	\N	AVAILABLE
a95cd978-e8f5-4094-9601-1129fd48c178	Room 505	PENTHOUSE	\N	5	450	20000.00	50000.00	OCCUPIED	f	\N	2026-07-05 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 19:08:05.948	\N	t	\N	\N	AVAILABLE
2253584c-f96c-49b8-8205-ad4d9742f135	Room 506	PENTHOUSE	\N	5	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-02 00:00:00	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956780/iris-plaza/rooms/rlobgd7jlwwyqsacxq9u.mp4	2026-03-19 06:02:19.133	2026-03-24 19:08:44.588	\N	t	\N	\N	AVAILABLE
268cd00c-dad9-40f7-9d91-d04d374de71d	Room 101	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-12-01 00:00:00	\N	2026-03-19 09:29:41.372	2026-03-28 13:27:02.814	\N	t	\N	19500.00	AVAILABLE
c314b0c1-850e-4ccb-b9b4-537cc596d6dd	Room 507	ONE_BHK	\N	5	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-20 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 19:09:32.987	\N	t	\N	\N	AVAILABLE
72cf67bd-7d1f-4952-8013-75b0ad7f4677	Room 102	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 12:54:02.945	2026-06-30 00:00:00	2026-07-01 00:00:00	\N	2026-03-18 19:36:53.445	2026-03-28 13:27:26.253	\N	t	\N	\N	AVAILABLE
ee5684cd-dc56-4e7f-818d-64a40135ee57	Room 508	ONE_BHK	\N	5	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-02-10 00:00:00	2026-07-06 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 19:10:19.043	\N	t	\N	\N	AVAILABLE
71563a65-7aa9-4d3e-9c2c-814e73d6e176	Room 501	PENTHOUSE	\N	5	450	29000.00	50000.00	AVAILABLE	t	\N	\N	2026-03-19 12:49:12.857	\N	2026-03-19 06:02:19.133	2026-03-30 08:02:33.465	\N	t	\N	\N	AVAILABLE
ca5a25b4-5dda-4bd4-8fb5-e9abacbe6e0e	Room 410	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-12-07 00:00:00	2026-12-08 00:00:00	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773957011/iris-plaza/rooms/vzbebybezwjrabnwxyfw.mp4	2026-03-19 06:02:19.133	2026-03-19 21:50:16.388	\N	t	\N	\N	AVAILABLE
c5a9766d-4162-4a24-b7fb-df0c5107bca2	Room 303	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-13 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:25:17.4	\N	t	\N	\N	AVAILABLE
e75bebe3-f0be-4c97-9362-080110ae7ed7	Room 304	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-12-31 00:00:00	2026-07-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:26:04.275	\N	t	\N	\N	AVAILABLE
55ee460d-7d0c-4de9-9cda-04e1be396e9d	Room 305	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:27:18.821	\N	t	\N	\N	AVAILABLE
1dae37f3-a38d-4a6e-a1cb-3997624e4172	Room 407	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
47caa164-b374-44ea-a106-4bb4fd669148	Room 408	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
3f12f2f7-76b4-4981-900e-d12336f9ae23	Room 107	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
c0f9abcf-39d0-4cc6-bb69-c5fca827e61c	Room 411	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-12-01 00:00:00	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1773956655/iris-plaza/rooms/cidcabzjklxskkfwoblb.mp4	2026-03-19 06:02:19.133	2026-03-19 21:44:20.773	\N	t	\N	\N	AVAILABLE
50b58cb2-1746-4f6f-981e-5c4bcba0c3bf	Double Occupancy Room	ONE_BHK	Spacious double room perfect for friends or couples.	2	300	12000.00	24000.00	AVAILABLE	t	\N	\N	2026-03-19 12:49:12.857	\N	2026-03-18 18:24:08.122	2026-03-19 12:05:01.031	2026-03-19 07:36:04.538	t	\N	\N	AVAILABLE
a8d71a94-a068-4d50-87d8-cbfca70d2c29	Room 307	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-15 00:00:00	2026-11-16 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:30:16.898	\N	t	\N	\N	AVAILABLE
9f34dfd1-129f-4cbe-bfad-5083ff4cc087	Room 308	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-07-31 00:00:00	2026-08-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:31:11.069	\N	t	\N	\N	AVAILABLE
32ca3d58-2527-4536-95d3-b0e1a68065e8	Room 309	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-04-15 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:32:05.654	\N	t	\N	\N	AVAILABLE
3461d1ba-93ee-4255-b744-c31afcc88870	Room 311	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-05-14 00:00:00	2027-05-15 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:34:29.527	\N	t	\N	\N	AVAILABLE
0250c85a-8d59-4045-8103-1ecb5e030537	Room 401	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-06-15 00:00:00	2027-06-16 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
fd073c81-b291-482d-81fe-9730027ff33a	Room 402	ONE_BHK	\N	4	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-31 00:00:00	2026-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
d9a32aab-2169-47d5-9fca-73f4ac9c1f1b	Room 406	ONE_BHK	\N	4	450	23000.00	50000.00	AVAILABLE	t	\N	\N	2026-03-19 12:49:12.857	\N	2026-03-19 06:02:19.133	2026-03-30 08:39:40.495	\N	t	\N	\N	AVAILABLE
1ec105a7-3c30-4f1d-b653-a5a49ba954b6	Deluxe Single Room	ONE_BHK	A cozy single room with attached bathroom and basic amenities.	1	450	20000.00	50000.00	AVAILABLE	t	\N	\N	2026-03-19 12:49:12.857	\N	2026-03-18 18:24:07.477	2026-03-19 12:05:00.774	2026-03-19 07:12:20.74	t	\N	\N	AVAILABLE
984dab09-fbc5-4954-a2a9-c259911413fe	Room 206	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-05-31 00:00:00	2027-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
ea15fc00-7111-46df-9624-bf7d6b1fc057	Room 208	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-10-30 00:00:00	2026-10-31 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
d4232bf4-594a-4e6e-80fd-a64f447a2a7f	Room 209	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-07-01 00:00:00	2026-07-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-19 06:02:19.133	\N	t	\N	\N	AVAILABLE
76ed2bb8-5d9d-4e87-81b9-d0879baa4f4d	Room 201	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-24 07:24:26.878	2026-10-31 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 07:24:26.906	\N	t	\N	\N	AVAILABLE
2afb68ae-8eba-4b94-8c5f-cffd2c2cfad3	Room 112	ONE_BHK	\N	1	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-06-30 00:00:00	2026-07-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:34:47.212	\N	t	\N	\N	AVAILABLE
e1668d3f-1c54-4f8e-80c8-2978206232ae	Room 202	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-12-31 00:00:00	2027-01-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:36:31.964	\N	t	\N	\N	AVAILABLE
4f87f3de-0452-45ad-8dbb-598e58b27d81	Room 203	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-10-31 00:00:00	2026-11-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:36:54.288	\N	t	\N	\N	AVAILABLE
e06741c9-66c3-40a8-a253-7c54413a8a93	Room 204	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2027-05-31 00:00:00	2027-06-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:38:02.897	\N	t	\N	\N	AVAILABLE
f237f8ee-4610-4d33-ac93-c07f59233888	Room 207	ONE_BHK	\N	2	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-12-01 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 08:39:08.642	\N	t	\N	\N	AVAILABLE
8249dc22-68bb-4861-b0e8-a58b0c79cd9a	Room 301	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	\N	2026-04-30 00:00:00	2026-01-08 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:23:23.81	\N	t	\N	\N	AVAILABLE
70b83387-b52d-4634-95cb-847a74ca6ea7	Room 310	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-11-30 00:00:00	2026-07-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:33:10.981	\N	t	\N	\N	AVAILABLE
f8e35850-947d-41a7-a2a1-84bc08785a92	Room 312	ONE_BHK	\N	3	450	20000.00	50000.00	OCCUPIED	f	2026-03-19 14:16:54.339	2026-05-19 00:00:00	2026-06-02 00:00:00	\N	2026-03-19 06:02:19.133	2026-03-24 09:35:20.928	\N	t	\N	\N	AVAILABLE
1bbfe617-85b0-471b-aaa3-32f7778898f1	Room 502	PENTHOUSE	\N	5	450	28000.00	50000.00	AVAILABLE	t	\N	\N	2026-03-19 12:49:12.857	\N	2026-03-19 06:02:19.133	2026-04-01 16:05:38.174	\N	t	\N	\N	AVAILABLE
5613458c-6238-4943-b332-ff7aa8f845c7	DILUX	ONE_BHK	DFGHKL. GYUJ	1	2000	20000.00	50000.00	OCCUPIED	f	2026-04-03 00:00:00	2026-04-04 00:00:00	\N	https://res.cloudinary.com/dtcp8qhoy/video/upload/v1775211458/iris-plaza/rooms/ewyqycok1njqn3nvotob.mp4	2026-04-03 10:17:47.398	2026-04-03 10:25:14.219	\N	f	2026-04-06 00:00:00	\N	OCCUPIED
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, description, "isPublic", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tenant_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_profiles (id, "userId", "dateOfBirth", gender, occupation, "companyName", "monthlyIncome", "emergencyName", "emergencyPhone", "emergencyRelation", "kycStatus", "kycVerifiedAt", "moveInDate", "moveOutDate", "createdAt", "updatedAt") FROM stdin;
d1053864-10ef-4ed6-9327-9cf39e1f3aa0	7b8016e0-e038-49fc-a28f-089a7da700c2	\N	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-20 03:28:38.166	2026-03-20 03:28:38.166
a4456612-a99a-47f3-993a-2f0666e02432	ec396521-cd21-4e78-a967-034f9edca118	\N	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-24 08:46:26.25	2026-03-24 08:46:26.25
c06964f5-903e-4605-bdfd-57aa22c1dd8c	048db42a-dbee-4682-bc13-5b1f0212eaa0	\N	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-24 12:06:48.136	2026-03-24 12:06:48.136
6e197b30-3ada-493e-b7b6-588ce42b54dc	a40d30be-4436-4d56-8179-647f385123d0	2005-10-12 00:00:00	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-25 14:46:46.721	2026-03-25 14:46:46.721
55fb8aa0-e66a-42a7-a753-05c3ab0db240	08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	2006-10-10 00:00:00	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-27 19:59:37.567	2026-03-27 19:59:37.567
2b5945f4-37a0-47f2-908a-a26530c2c7e8	e558c5f6-72a9-416b-b80b-e8b4fa242e75	2026-03-19 00:00:00	\N	\N	\N	\N	\N	\N	\N	NOT_STARTED	\N	\N	\N	2026-03-30 08:19:57.857	2026-03-30 08:19:57.857
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone, password, role, "firstName", "lastName", "isActive", "isApproved", "accountStatus", "isEmailVerified", "isPhoneVerified", "emailVerifyToken", "createdAt", "updatedAt", "deletedAt", dob) FROM stdin;
a7503d68-baaf-4cf8-84fd-872b2bfb121f	swetha@test.com	9000001013	dummy	TENANT	SWETHA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-19 21:37:01.932	\N	\N
de9d9a1f-9330-40c7-85fa-fd3e4a0b800b	krishna@test.com	9000001021	dummy	TENANT	KRISHNA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-19 21:37:01.932	\N	\N
943888d3-e0c8-4239-85b2-ef4c267c9d53	arushi@test.com	9000001113	dummy	TENANT	ARUSHI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-19 21:42:02.168	\N	\N
01c9adc2-486d-4431-a2f3-2d4c6d6b0948	owais@test.com	9000001118	dummy	TENANT	OWAIS	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-19 21:42:02.168	\N	\N
c3b858c4-72b7-48e9-b0f5-5b61dbb11358	arun@test.com	9000001006	dummy	TENANT	ARUN	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:28:34.495	\N	\N
741a0096-6bff-4967-bc2a-82f9f5c9ad04	vignesh@test.com	9000001003	dummy	TENANT	VIGNESH	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-24 08:23:06.914	\N	\N
de8adcc0-05f6-427b-b09a-7676b49aa5e0	krit@test.com	9000001007	dummy	TENANT	KRIT	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:29:29.611	\N	\N
2a90a822-ac46-4639-b385-288e0ae98874	salman@test.com	9000001012	dummy	TENANT	SALMAN	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:31:06.557	\N	\N
91d30180-6ecd-44e7-ab14-07c099b1830d	ayushman@test.com	9000001014	dummy	TENANT	AYUSHMAN	KUNDU	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:33:09.886	\N	\N
61fc6e99-775e-4533-8618-86103eded40f	mariyam@test.com	9000001015	dummy	TENANT	MARIYAM	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:33:25.692	\N	\N
1aed8ae8-a336-4e29-be61-f193f028d011	pooja@test.com	9000001017	dummy	TENANT	POOJA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:33:48.057	\N	\N
ab178d92-68f1-4aad-83ef-819d82edff00	aparna@test.com	9000001016	dummy	TENANT	APARNA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 08:38:01.369	\N	\N
4d9f50a6-83a4-41c1-919a-e0fb15c91353	chandana@test.com	9000001020	dummy	TENANT	CHANDANA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:35:03.846	\N	\N
dc4bd9fd-f14b-4762-8b59-de77427582be	divij@test.com	9000001023	dummy	TENANT	DIVIJ	BISHNOY	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:36:12.967	\N	\N
1546f1f8-7709-4403-bcc1-91681d13021c	aditya@test.com	9000001025	dummy	TENANT	ADITYA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:36:43.501	\N	\N
fae21f70-451b-4976-999b-16ae69a63a41	mayank@test.com	9000001024	dummy	TENANT	MAYANK	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 09:24:30.474	\N	\N
17632dcd-fbbf-429b-a955-12628d76606d	divyoth@test.com	9000001027	dummy	TENANT	DEBJYOTHI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:37:04.968	\N	\N
29bcb55d-fea4-4e2f-a1f1-086fd14f41c4	pavani@test.com	9000001026	dummy	TENANT	PAVANI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 09:26:00.791	\N	\N
43419cca-2e1e-4228-8e81-1fa927609ddd	rahul@test.com	9000001029	dummy	TENANT	RAHUL	DEV	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:38:01.867	\N	\N
fa7f45a9-046c-4060-af50-06d68307e016	tanmay@test.com	9000001028	dummy	TENANT	TARINI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 09:28:57.434	\N	\N
56a2709f-2a85-4445-8a1a-254ac29f9c62	abhigyan@test.com	9000001030	dummy	TENANT	ABDHULLA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:38:22.802	\N	\N
4f7bdf65-7b9c-42bc-a2f8-a9f1a8e76c0e	mayvettiyer@test.com	9000001114	dummy	TENANT	MAY	MTET THWE KHAING	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:22:14.717	\N	\N
902643cf-68cf-44a8-9034-4eb230e93013	akhlesh@test.com	9000001031	dummy	TENANT	AKILESH	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 09:32:02.781	\N	\N
786f01ce-dff6-4653-b49a-ffde5202cf75	amrutha@test.com	9000001033	dummy	TENANT	AMRUTHA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:39:32.117	\N	\N
39a95ccb-bfcc-45e0-b1eb-c78c8d02e467	anousha@test.com	9000001034	dummy	TENANT	ANOUSHKA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:39:43.591	\N	\N
7928928f-6f94-4cf4-87c4-6b15acdf7daa	gayatri@test.com	9000001032	dummy	TENANT	GAYATRI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 07:20:25.263	\N	\N
65ef83e4-94ba-4bae-b2c7-5cad77089f18	gangam@test.com	9000001004	dummy	TENANT	GANGAM	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:27:32.496	\N	\N
44e00b99-2324-4b3f-9704-54508b2f0e78	shuina@test.com	9000001009	dummy	TENANT	SHUINA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:30:13.633	\N	\N
4eec2bc6-dd60-4fbc-820a-b32b51f994a2	madhav@test.com	9000001002	dummy	TENANT	MADHAV	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-28 12:38:27.138	\N	\N
560346ff-e0c6-408f-9b9c-0481d975d75f	sidhanth@test.com	9000001115	dummy	TENANT	SIDHANT	AND SAMEEKSHA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:47:19.616	\N	\N
ae6d66e3-5354-477e-8479-1d40c925cd95	mangalam@test.com	9000001116	dummy	TENANT	MANGLAM	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:47:35.783	\N	\N
709e6da4-07b1-46da-8e39-6b776b0db3a2	manya@test.com	9000001112	dummy	TENANT	MANYA	NARULA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:08:35.7	\N	\N
8a25da7b-af72-45c2-ad2c-4425116cf466	sanajay@test.com	9000001117	dummy	TENANT	SANAJAY	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-24 19:10:18.572	\N	\N
6e73600f-145f-4471-b95c-a2c113d08aa6	teja@test.com	9000001010	dummy	TENANT	TEJA	RAM	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:30:27.285	\N	\N
5f229753-5b26-4f40-9eb9-58ecb34268bd	akshat@test.com	9000001005	dummy	TENANT	AKSHAT	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:28:17.866	\N	\N
6052e510-3d6a-40a8-a4d1-c84de1d06050	abraham@test.com	9000001008	dummy	TENANT	ABRAHAM	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 06:29:46.713	\N	\N
82d784ba-0343-4e07-aca7-7b0c71ca4ce2	vedpal@test.com	9000001018	dummy	TENANT	VEDPAL	TUKRAN	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:34:28.489	\N	\N
bb012c88-9588-4ea3-807f-4e5e56bdc805	vianca@test.com	9000001019	dummy	TENANT	VIANCA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:34:48.089	\N	\N
a2bacbcc-b5cb-49ea-ac06-c5a99e2b9a50	anurag@test.com	9000001022	dummy	TENANT	ANURAG	YOGENDRA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-30 06:35:54.803	\N	\N
0905d563-47d7-4c82-b75f-8c02cf791bca	ahmed@test.com	9000001101	dummy	TENANT	AHMED	SHIFRAN	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:13:44.333	\N	\N
f365f3d6-8a96-4f98-977c-eba47c925830	erfan@test.com	9000001103	dummy	TENANT	ERFAN	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:42:19.556	\N	\N
7e700586-4e2a-41a2-8049-466263b60cf4	anahita@test.com	9000001104	dummy	TENANT	ANAHITA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:42:44.303	\N	\N
e70447c5-99c5-44df-afa0-e5265522a0fc	aditi@test.com	9000001105	dummy	TENANT	ADITI	GUPTA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:42:59.302	\N	\N
40df8ba3-2910-41ea-9fee-7539a8b7e053	bikram@test.com	9000001106	dummy	TENANT	BIKRAMJEET	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:43:19.924	\N	\N
5a061c77-ac97-47df-9413-4a77a870cc7c	saami@test.com	9000001107	dummy	TENANT	SAAMI	ISMAIL	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:43:37.814	\N	\N
88669851-2727-45e7-9964-7ab4317e3304	vamshi@test.com	9000001102	dummy	TENANT	VAMSHI	KRISHNA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:13:18.634	\N	\N
145c46de-2617-4d2b-9e9c-25af39ab0a9d	hriday@test.com	9000001108	dummy	TENANT	HRIDAY	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:10:27.952	\N	\N
bd275241-a9a0-48d4-9f41-853a795a18b8	anirudh@test.com	9000001110	dummy	TENANT	ANIRUDH	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 06:45:19.216	\N	\N
60c55148-df43-4724-884f-d22ac17e0f68	arpita@test.com	9000001111	dummy	TENANT	ARPITA	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:09:06.644	\N	\N
49a1cae6-8ee3-4d43-89cb-e37b2ed5e370	mitali@test.com	9000001109	dummy	TENANT	IMTIAZ	MONDAL	t	t	ACTIVE	f	t	\N	2026-03-19 21:42:02.168	2026-03-30 07:09:30.673	\N	\N
7b8016e0-e038-49fc-a28f-089a7da700c2	mushrthmishu@gmail.com	9844062575	$2b$12$ItcaN6mPbGVdoKpLdD2oYeHWnMbvuXRewHRMnr9MGHxhaFuVFIfp2	TENANT	Isa	Mohd	t	t	ACTIVE	f	f	\N	2026-03-20 03:28:38.166	2026-03-20 03:28:38.166	\N	\N
e558c5f6-72a9-416b-b80b-e8b4fa242e75	1414mishal@gmail.com	1414mishal@gmail.com	DOB_AUTH_DISABLED	TENANT	Mohammed	Mishal	t	t	ACTIVE	f	f	\N	2026-03-30 08:19:57.857	2026-03-30 08:19:57.857	\N	2026-03-19 00:00:00
6d509995-7d3c-4950-9108-ef835d53cb8f	advait@test.com	9000001011	dummy	TENANT	ADVAIT	VERMA	t	t	ACTIVE	f	t	\N	2026-03-19 21:37:01.932	2026-03-24 08:34:14.336	\N	\N
df0dbc4d-51f8-49b1-b5a2-899855d55685	\N	BISHNOY		TENANT	DIVU		t	t	ACTIVE	f	f	\N	2026-03-24 08:44:27.234	2026-03-24 08:44:27.234	\N	\N
ec396521-cd21-4e78-a967-034f9edca118	divubishmoy@gmail.com	9000001452	$2b$12$cBcES.aXnm8wCDPsi9hQLuaFDKSrpgmscW5wrMBFr.TF7Pm4Z50Ku	TENANT	DIVU	BISHMOY	t	t	ACTIVE	f	f	\N	2026-03-24 08:46:26.25	2026-03-24 08:46:26.25	\N	\N
048db42a-dbee-4682-bc13-5b1f0212eaa0	mohammedrayaan865@gmail.com	9739396590	$2b$12$ThgeMQANXxG6Nt/zqjPXHuajZqcc7E7Fuh84zrTEth53gFSxKGpKS	TENANT	Mohammed	Rayaan	t	f	SUSPENDED	f	f	\N	2026-03-24 12:06:48.136	2026-03-24 15:26:27.152	\N	\N
a40d30be-4436-4d56-8179-647f385123d0	mumthaz2314@gmail.com	6366732699	DOB_AUTH_DISABLED	TENANT	Mumthaz	na	t	t	ACTIVE	f	f	\N	2026-03-25 14:46:46.721	2026-03-25 14:46:46.721	\N	2005-10-12 00:00:00
16e4816c-a7fc-49b4-b97e-c2b9cba45d24	\N	9999999999		TENANT	SWETHA		t	t	ACTIVE	f	f	\N	2026-03-24 07:24:25.502	2026-03-30 06:32:11.83	\N	\N
49f469a5-78de-4bc7-85c9-c4fccea3b4fc	vyshnavi@test.com	9845354061	dummy	TENANT	VYSHNAVI	NA	t	t	ACTIVE	f	t	\N	2026-03-19 21:12:24.652	2026-03-30 07:17:06.439	\N	\N
66ba2864-ff6d-4e48-ab82-7d4912bb1b00	admin@manipal.com	+919845151899	$2b$12$ikdHpxwRNpSrGaYP8.Z9nu.lJ4WbdK6iepsgo/.FovmdmABs5CgVq	ADMIN	Admin	User	t	f	ACTIVE	t	t	\N	2026-03-18 18:24:04.681	2026-04-03 10:25:14.005	\N	2006-10-10 00:00:00
08e5d4c5-9ae4-44cc-b2ae-c7556965b15b	\N	9606652501	DOB_AUTH_DISABLED	TENANT	RAYAAN	rayaan	t	t	ACTIVE	f	f	\N	2026-03-27 19:59:37.567	2026-04-03 10:25:14.193	\N	2025-01-01 00:00:00
\.


--
-- Name: room_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_rules_id_seq', 1, true);


--
-- Name: room_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_transfers_id_seq', 1, false);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: agreements agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_pkey PRIMARY KEY (id);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: booking_status_history booking_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_status_history
    ADD CONSTRAINT booking_status_history_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cancellation_requests cancellation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT cancellation_requests_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: extension_requests extension_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_requests
    ADD CONSTRAINT extension_requests_pkey PRIMARY KEY (id);


--
-- Name: maintenance_tickets maintenance_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: rent_cycles rent_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rent_cycles
    ADD CONSTRAINT rent_cycles_pkey PRIMARY KEY (id);


--
-- Name: room_amenities room_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_amenities
    ADD CONSTRAINT room_amenities_pkey PRIMARY KEY (id);


--
-- Name: room_images room_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_images
    ADD CONSTRAINT room_images_pkey PRIMARY KEY (id);


--
-- Name: room_media room_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_media
    ADD CONSTRAINT room_media_pkey PRIMARY KEY (id);


--
-- Name: room_rules room_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_rules
    ADD CONSTRAINT room_rules_pkey PRIMARY KEY (id);


--
-- Name: room_transfers room_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_profiles tenant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_profiles
    ADD CONSTRAINT tenant_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: agreements_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "agreements_bookingId_key" ON public.agreements USING btree ("bookingId");


--
-- Name: amenities_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX amenities_name_key ON public.amenities USING btree (name);


--
-- Name: cancellation_requests_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "cancellation_requests_bookingId_key" ON public.cancellation_requests USING btree ("bookingId");


--
-- Name: idx_room_rules_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_rules_room_id ON public.room_rules USING btree (room_id);


--
-- Name: idx_room_transfers_effective_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_transfers_effective_status ON public.room_transfers USING btree (effective_date, status);


--
-- Name: idx_room_transfers_to_room_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_transfers_to_room_pending ON public.room_transfers USING btree (to_room_id, status);


--
-- Name: otps_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX otps_phone_key ON public.otps USING btree (phone);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: rent_cycles_bookingId_year_month_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "rent_cycles_bookingId_year_month_key" ON public.rent_cycles USING btree ("bookingId", year, month);


--
-- Name: room_amenities_roomId_amenityId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "room_amenities_roomId_amenityId_key" ON public.room_amenities USING btree ("roomId", "amenityId");


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: tenant_profiles_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tenant_profiles_userId_key" ON public.tenant_profiles USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: agreements agreements_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT "agreements_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booking_status_history booking_status_history_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_status_history
    ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cancellation_requests cancellation_requests_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT "cancellation_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cancellation_requests cancellation_requests_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancellation_requests
    ADD CONSTRAINT "cancellation_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documents documents_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: extension_requests extension_requests_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_requests
    ADD CONSTRAINT "extension_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: extension_requests extension_requests_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extension_requests
    ADD CONSTRAINT "extension_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_tickets maintenance_tickets_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT "maintenance_tickets_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_tickets maintenance_tickets_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT "maintenance_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: otps otps_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_rentCycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_rentCycleId_fkey" FOREIGN KEY ("rentCycleId") REFERENCES public.rent_cycles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rent_cycles rent_cycles_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rent_cycles
    ADD CONSTRAINT "rent_cycles_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rent_cycles rent_cycles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rent_cycles
    ADD CONSTRAINT "rent_cycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: room_amenities room_amenities_amenityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_amenities
    ADD CONSTRAINT "room_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES public.amenities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: room_amenities room_amenities_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_amenities
    ADD CONSTRAINT "room_amenities_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: room_images room_images_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_images
    ADD CONSTRAINT "room_images_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: room_media room_media_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_media
    ADD CONSTRAINT "room_media_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_profiles tenant_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_profiles
    ADD CONSTRAINT "tenant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Pj1Ww3bUSiTEUGoa3CUWQPxJOx4d2ohm5Si8VLC0tymQdJWBLR69ksihyfsby6a

