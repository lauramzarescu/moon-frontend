import * as z from 'zod';
import { TwoFactorMethod, YubikeyAuthType } from '@/enums/user/user.enum.ts';

export const twoFactorStatusSchema = z.object({
    enabled: z.boolean(),
    verified: z.boolean(),
    method: z.nativeEnum(TwoFactorMethod).optional().nullable(),
    yubikeyCount: z.number().optional().default(0),
    hasWebAuthn: z.boolean().optional().default(false),
    webauthnCount: z.number().optional().default(0),
    hasTotp: z.boolean().optional().default(false),
    hasYubikeyOTP: z.boolean().optional().default(false),
    securityLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    availableMethods: z.array(z.nativeEnum(TwoFactorMethod)).optional().default([]),
});

export const twoFactorSetupResponseSchema = z.object({
    qrCode: z.string(),
    secret: z.string(),
});

export const yubikeyInfoSchema = z.object({
    id: z.string(),
    publicId: z.string(),
    nickname: z.string().optional(),
    createdAt: z.string(),
    lastUsed: z.string().optional(),
    credentialId: z.string().optional(),
    credentialPublicKey: z.string().optional(),
    counter: z.number().optional(),
    credentialDeviceType: z.string().optional(),
    credentialBackedUp: z.boolean().optional(),
    transports: z.array(z.string()).optional(),
    authType: z.nativeEnum(YubikeyAuthType).optional(),
    isActive: z.boolean().optional().default(true),
});

export const yubikeyInfoResponseSchema = z.object({
    data: z.array(yubikeyInfoSchema),
});

export const yubikeySetupResponseSchema = z.object({
    success: z.boolean(),
    yubikeyId: z.string(),
    publicId: z.string(),
});

export type TwoFactorStatus = z.infer<typeof twoFactorStatusSchema>;
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>;
export type YubikeyInfo = z.infer<typeof yubikeyInfoSchema>;
export type YubikeySetupResponse = z.infer<typeof yubikeySetupResponseSchema>;
