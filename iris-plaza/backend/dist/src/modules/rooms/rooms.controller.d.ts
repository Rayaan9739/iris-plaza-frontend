import { RoomsService } from "./rooms.service";
import { UpdateRoomDto } from "./dto/room.dto";
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    findAll(): Promise<{
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        managementRent: import("@prisma/client/runtime/library").Decimal | null;
        managementStatus: import(".prisma/client").$Enums.RoomStatus | null;
        managementIsAvailable: boolean | null;
        managementOccupiedUntil: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    }[]>;
    getAvailableRooms(month?: string): Promise<{
        rent: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedUntil: Date | null;
        availabilityStatus: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
        availableFrom: string | null;
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        floor: number;
        area: number;
        deposit: import("@prisma/client/runtime/library").Decimal;
        occupiedFrom: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        managementRent: import("@prisma/client/runtime/library").Decimal | null;
        managementStatus: import(".prisma/client").$Enums.RoomStatus | null;
        managementIsAvailable: boolean | null;
        managementOccupiedUntil: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    }[]>;
    findOccupiedRooms(): Promise<{
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        managementRent: import("@prisma/client/runtime/library").Decimal | null;
        managementStatus: import(".prisma/client").$Enums.RoomStatus | null;
        managementIsAvailable: boolean | null;
        managementOccupiedUntil: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    }[]>;
    findOne(id: string): Promise<{
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        description: string | null;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    }>;
    create(body: any): Promise<{
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        description: string | null;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    }>;
    update(id: string, updateRoomDto: UpdateRoomDto): Promise<{
        rules: string[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        description: string | null;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        amenities: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[];
        media: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[];
    } | {
        booking: {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            roomId: string;
            userId: string;
            moveInDate: Date | null;
            moveOutDate: Date | null;
            bookingSource: import(".prisma/client").$Enums.BookingSource;
            brokerName: string | null;
        };
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            email: string | null;
            phone: string;
            password: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string;
            lastName: string;
            isActive: boolean;
            isApproved: boolean;
            accountStatus: import(".prisma/client").$Enums.AccountStatus;
            isEmailVerified: boolean;
            isPhoneVerified: boolean;
            emailVerifyToken: string | null;
            dob: Date | null;
        };
        message: string;
        amenities?: ({
            amenity: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                icon: string | null;
            };
        } & {
            id: string;
            roomId: string;
            amenityId: string;
        })[] | undefined;
        images?: {
            id: string;
            createdAt: Date;
            roomId: string;
            url: string;
            caption: string | null;
            isPrimary: boolean;
            order: number;
        }[] | undefined;
        media?: {
            id: string;
            type: string;
            createdAt: Date;
            roomId: string;
            url: string;
        }[] | undefined;
        id?: string | undefined;
        name?: string | undefined;
        type?: import(".prisma/client").$Enums.RoomType | undefined;
        description?: string | null | undefined;
        floor?: number | undefined;
        area?: number | undefined;
        rent?: import("@prisma/client/runtime/library").Decimal | undefined;
        deposit?: import("@prisma/client/runtime/library").Decimal | undefined;
        status?: import(".prisma/client").$Enums.RoomStatus | undefined;
        isAvailable?: boolean | undefined;
        occupiedFrom?: Date | null | undefined;
        occupiedUntil?: Date | null | undefined;
        availableAt?: Date | null | undefined;
        videoUrl?: string | null | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        deletedAt?: Date | null | undefined;
        managementRent?: import("@prisma/client/runtime/library").Decimal | null | undefined;
        managementStatus?: import(".prisma/client").$Enums.RoomStatus | null | undefined;
        managementIsAvailable?: boolean | null | undefined;
        managementOccupiedUntil?: Date | null | undefined;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.RoomType;
        description: string | null;
        floor: number;
        area: number;
        rent: import("@prisma/client/runtime/library").Decimal;
        deposit: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.RoomStatus;
        isAvailable: boolean;
        occupiedFrom: Date | null;
        occupiedUntil: Date | null;
        availableAt: Date | null;
        videoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        managementRent: import("@prisma/client/runtime/library").Decimal | null;
        managementStatus: import(".prisma/client").$Enums.RoomStatus | null;
        managementIsAvailable: boolean | null;
        managementOccupiedUntil: Date | null;
    }>;
}
