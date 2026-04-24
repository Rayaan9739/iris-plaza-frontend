export declare const ROLES_KEY = "roles";
export type UserRole = 'ADMIN' | 'TENANT';
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
