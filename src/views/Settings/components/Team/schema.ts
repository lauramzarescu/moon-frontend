import { z } from 'zod';
import { LoginType, UserRole } from '@/enums/user/user.enum.ts';

export const userDeviceInfoSchema = z.object({
    fingerprint: z.string(),
    lastVerified: z.string(),
    userAgent: z.string().optional(),
});

export const userSchema = z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
    email: z.string().email(),
    organizationId: z.string(),
    password: z.string().optional().nullable(),
    loginType: z.nativeEnum(LoginType).default(LoginType.local),
    role: z.nativeEnum(UserRole).default(UserRole.user),
    nameID: z.string().optional().nullable(),
    nameIDFormat: z.string().optional().nullable(),
    lastLogin: z.date().optional().nullable(),
    sessionIndex: z.string().optional().nullable(),
    twoFactorSecret: z.string().optional().nullable(),
    twoFactorVerified: z.boolean().default(false),
    verifiedDevices: z.array(userDeviceInfoSchema).optional(),
    resetToken: z.string().optional().nullable(),
    resetTokenExpiry: z.date().optional().nullable(),
    twoFactorResetToken: z.string().optional().nullable(),
    twoFactorResetTokenExpiry: z.date().optional().nullable(),
});

export const userDetailsResponseSchema = userSchema.omit({
    lastLogin: true,
    password: true,
    nameID: true,
    nameIDFormat: true,
    sessionIndex: true,
    twoFactorSecret: true,
    resetToken: true,
    resetTokenExpiry: true,
    twoFactorResetToken: true,
    twoFactorResetTokenExpiry: true,
});

export const userCreateSchema = userSchema
    .omit({
        loginType: true,
        nameID: true,
        nameIDFormat: true,
        lastLogin: true,
        sessionIndex: true,
        twoFactorSecret: true,
        twoFactorVerified: true,
        resetToken: true,
        resetTokenExpiry: true,
        twoFactorResetToken: true,
        twoFactorResetTokenExpiry: true,
    })
    .partial({
        organizationId: true,
    });

export const userUpdateSchema = userCreateSchema;

// Password schemas
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePasswordWith2FASchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    code: z.string().length(6, '2FA code must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const adminResetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// 2FA schemas
export const twoFactorVerifySchema = z.object({
    code: z.string().min(6).max(6),
});

export const twoFactorDisableSchema = twoFactorVerifySchema;

export const reset2FASchema = z.object({
    email: z.string().email('Valid email is required'),
});

export type UserInput = z.infer<typeof userSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorDisableInput = z.infer<typeof twoFactorDisableSchema>;
export type UserDeviceInfo = z.infer<typeof userDeviceInfoSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
export type Reset2FAInput = z.infer<typeof reset2FASchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePasswordWith2FAInput = z.infer<typeof changePasswordWith2FASchema>;
export type UserDetailsResponseInput = z.infer<typeof userDetailsResponseSchema>;

/** ================================ */
/** ===== Access control schema ==== */
/** ================================ */
export const accessControlSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    organizationId: z.string().uuid(),
    description: z.string().optional(),
    isAllowed: z.boolean().default(true),
});

export const accessControlCreateSchema = accessControlSchema.omit({
    id: true,
    organizationId: true,
    isAllowed: true,
});

export type AccessControlInput = z.infer<typeof accessControlSchema>;
export type AccessControlCreateInput = z.infer<typeof accessControlCreateSchema>;

/** ================================ */
/** ===== Form validation schemas === */
/** ================================ */

export const createUserFormSchema = z
    .object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
        role: z.string().min(1, 'Role is required'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export type CreateUserFormInput = z.infer<typeof createUserFormSchema>;
