export interface Room {
  id: string;
  name: string;
  type: "ONE_BHK" | "TWO_BHK" | "PENTHOUSE";
  rent: number;
  deposit: number;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
  amenities: string[];
  description: string;
  rules: string[];
  images: string[];
  videoUrl?: string;
  previewMedia?: {
    type: "image" | "video";
    url: string;
  } | null;
  media?: Array<{
    type: "image" | "video";
    url: string;
    order?: number;
  }>;
  area: number;
  floor: number;
  occupiedUntil?: string;
  availabilityStatus?: "AVAILABLE" | "OCCUPIED";
  availableFrom?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string;
  roomName: string;
  moveInDate: string;
  paymentStatus: "paid" | "pending" | "overdue";
  avatar: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  roomName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  method?: string;
}

export interface BookingRequest {
  id: string;
  tenantName: string;
  roomName: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  documents: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "other";
  status: "uploaded" | "pending" | "approved" | "rejected";
  uploadedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  roomName: string;
}

export const mockRooms: Room[] = [
  {
    id: "1",
    name: "Room 101",
    type: "ONE_BHK",
    rent: 850,
    deposit: 1700,
    status: "AVAILABLE",
    area: 25,
    floor: 1,
    amenities: ["Wi-Fi", "Air Conditioning", "Private Bathroom", "Desk"],
    description:
      "A cozy single room with modern furnishings, natural light, and a private bathroom. Perfect for students and young professionals.",
    rules: ["No smoking", "No pets", "Quiet hours after 10 PM"],
    images: ["/placeholder.svg"],
  },
  {
    id: "2",
    name: "Room 202",
    type: "ONE_BHK",
    rent: 1200,
    deposit: 2400,
    status: "AVAILABLE",
    area: 35,
    floor: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Shared Kitchen",
      "Balcony",
      "Washing Machine",
    ],
    description:
      "Spacious double room with a balcony overlooking the garden. Shared kitchen access and laundry facilities.",
    rules: ["No smoking", "Pets allowed with deposit", "Guest policy applies"],
    images: ["/placeholder.svg"],
  },
  {
    id: "3",
    name: "Studio A",
    type: "ONE_BHK",
    rent: 1500,
    deposit: 3000,
    status: "OCCUPIED",
    area: 45,
    floor: 3,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Full Kitchen",
      "Balcony",
      "Gym Access",
      "Parking",
    ],
    description:
      "Modern studio apartment with a fully equipped kitchen, spacious living area, and access to building amenities.",
    rules: [
      "No smoking indoors",
      "Pets under 10kg allowed",
      "1 parking spot included",
    ],
    images: ["/placeholder.svg"],
  },
  {
    id: "4",
    name: "Suite 301",
    type: "PENTHOUSE",
    rent: 2200,
    deposit: 4400,
    status: "OCCUPIED",
    area: 60,
    floor: 3,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Full Kitchen",
      "Living Room",
      "Balcony",
      "Gym Access",
      "Pool Access",
      "Parking",
    ],
    description:
      "Premium suite with separate living room, premium furnishings, and full access to all building amenities including pool and gym.",
    rules: ["No smoking", "Pets allowed", "2 parking spots included"],
    images: ["/placeholder.svg"],
  },
  {
    id: "5",
    name: "Room 105",
    type: "ONE_BHK",
    rent: 780,
    deposit: 1560,
    status: "AVAILABLE",
    area: 22,
    floor: 1,
    amenities: ["Wi-Fi", "Fan", "Shared Bathroom", "Desk"],
    description:
      "Budget-friendly single room ideal for students. Shared bathroom facilities and communal kitchen.",
    rules: ["No smoking", "No pets", "Quiet hours after 10 PM"],
    images: ["/placeholder.svg"],
  },
  {
    id: "6",
    name: "Room 208",
    type: "ONE_BHK",
    rent: 1100,
    deposit: 2200,
    status: "AVAILABLE",
    area: 32,
    floor: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Private Bathroom",
      "Desk",
      "Wardrobe",
    ],
    description:
      "Well-appointed double room with private en-suite bathroom and ample storage space.",
    rules: ["No smoking", "No pets", "Visitors until 9 PM"],
    images: ["/placeholder.svg"],
  },
  {
    id: "7",
    name: "Penthouse Suite",
    type: "PENTHOUSE",
    rent: 3500,
    deposit: 7000,
    status: "AVAILABLE",
    area: 85,
    floor: 5,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Full Kitchen",
      "Living Room",
      "Balcony",
      "Gym Access",
      "Pool Access",
      "Parking",
      "Terrace",
    ],
    description:
      "Luxurious penthouse with panoramic views, private terrace, and premium amenities.",
    rules: ["No smoking", "Pets allowed with deposit", "2 parking spots included"],
    images: ["/placeholder.svg"],
  },
];

export const mockTenants: Tenant[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+1 234 567 890",
    roomId: "4",
    roomName: "Suite 301",
    moveInDate: "2024-06-15",
    paymentStatus: "paid",
    avatar: "SJ",
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike@email.com",
    phone: "+1 234 567 891",
    roomId: "3",
    roomName: "Studio A",
    moveInDate: "2024-08-01",
    paymentStatus: "pending",
    avatar: "MC",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily@email.com",
    phone: "+1 234 567 892",
    roomId: "2",
    roomName: "Room 202",
    moveInDate: "2024-09-01",
    paymentStatus: "overdue",
    avatar: "ED",
  },
];

export const mockPayments: Payment[] = [
  {
    id: "1",
    tenantId: "1",
    tenantName: "Sarah Johnson",
    roomName: "Suite 301",
    amount: 2200,
    date: "2025-02-01",
    dueDate: "2025-02-05",
    status: "paid",
    method: "Bank Transfer",
  },
  {
    id: "2",
    tenantId: "2",
    tenantName: "Mike Chen",
    roomName: "Studio A",
    amount: 1500,
    date: "",
    dueDate: "2025-02-05",
    status: "pending",
  },
  {
    id: "3",
    tenantId: "3",
    tenantName: "Emily Davis",
    roomName: "Room 202",
    amount: 1200,
    date: "",
    dueDate: "2025-01-05",
    status: "overdue",
  },
  {
    id: "4",
    tenantId: "1",
    tenantName: "Sarah Johnson",
    roomName: "Suite 301",
    amount: 2200,
    date: "2025-01-01",
    dueDate: "2025-01-05",
    status: "paid",
    method: "Bank Transfer",
  },
  {
    id: "5",
    tenantId: "1",
    tenantName: "Sarah Johnson",
    roomName: "Suite 301",
    amount: 2200,
    date: "2024-12-01",
    dueDate: "2024-12-05",
    status: "paid",
    method: "Credit Card",
  },
];

export const mockBookingRequests: BookingRequest[] = [
  {
    id: "1",
    tenantName: "Alex Rivera",
    roomName: "Room 101",
    date: "2025-02-20",
    status: "pending",
    documents: [
      {
        id: "1",
        name: "ID Card",
        type: "identity",
        fileUrl: "https://placehold.co/600x400/png?text=ID+Card",
        fileType: "image",
        status: "uploaded",
        uploadedAt: "2025-02-19",
      },
      {
        id: "2",
        name: "Proof of Income",
        type: "income",
        fileUrl: "https://placehold.co/600x800/png?text=Income+Proof",
        fileType: "pdf",
        status: "pending",
      },
    ],
  },
  {
    id: "2",
    tenantName: "Jordan Lee",
    roomName: "Room 105",
    date: "2025-02-18",
    status: "pending",
    documents: [
      {
        id: "3",
        name: "ID Card",
        type: "identity",
        fileUrl: "https://placehold.co/600x400/png?text=ID+Card",
        fileType: "image",
        status: "approved",
        uploadedAt: "2025-02-17",
      },
      {
        id: "4",
        name: "Proof of Income",
        type: "income",
        fileUrl: "https://placehold.co/600x800/png?text=Income+Proof",
        fileType: "image",
        status: "uploaded",
        uploadedAt: "2025-02-17",
      },
    ],
  },
  {
    id: "3",
    tenantName: "Casey Smith",
    roomName: "Room 208",
    date: "2025-02-15",
    status: "approved",
    documents: [
      {
        id: "5",
        name: "ID Card",
        type: "identity",
        fileUrl: "https://placehold.co/600x400/png?text=ID+Card",
        fileType: "image",
        status: "approved",
        uploadedAt: "2025-02-14",
      },
      {
        id: "6",
        name: "Proof of Income",
        type: "income",
        fileUrl: "https://placehold.co/600x800/png?text=Income+Proof",
        fileType: "pdf",
        status: "approved",
        uploadedAt: "2025-02-14",
      },
    ],
  },
];

export const mockMaintenanceTickets: MaintenanceTicket[] = [
  {
    id: "1",
    title: "Leaking Faucet",
    description: "Kitchen faucet has a slow drip that needs fixing.",
    category: "Plumbing",
    priority: "medium",
    status: "open",
    createdAt: "2025-02-20",
    roomName: "Suite 301",
  },
  {
    id: "2",
    title: "AC Not Cooling",
    description: "Air conditioning unit is running but not producing cold air.",
    category: "HVAC",
    priority: "high",
    status: "in-progress",
    createdAt: "2025-02-18",
    roomName: "Studio A",
  },
  {
    id: "3",
    title: "Light Bulb Replacement",
    description: "Bathroom light bulb needs to be replaced.",
    category: "Electrical",
    priority: "low",
    status: "resolved",
    createdAt: "2025-02-15",
    roomName: "Room 202",
  },
];

