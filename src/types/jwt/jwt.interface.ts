import { LoginType, PermissionEnum, type UserRole } from '@/enums/user/user.enum.ts';
import type { JwtPayload } from 'jsonwebtoken';

export interface JwtInterface extends JwtPayload {
    userId: string;
    email: string;
    permissions: PermissionEnum[];
    role: UserRole;
    name: string;
    loginType: LoginType;
    exp: number;
}
