export declare class SignUpDto {
    phone: string;
    email?: string;
    firstName: string;
    lastName: string;
    dob: string;
    fatherName?: string;
    relation?: string;
    aadhaarNumber?: string;
    gender?: string;
    tenantAddress?: string;
    collegeName?: string;
}
export declare class SignInDto {
    phone: string;
    dob: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class SetDobDto {
    phone: string;
    dob: string;
}
