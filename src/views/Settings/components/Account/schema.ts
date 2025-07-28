import * as z from 'zod';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';

export const twoFactorStatusSchema = z.object({
    enabled: z.boolean(),
    verified: z.boolean(),
    method: z.nativeEnum(TwoFactorMethod).optional().nullable(),
    yubikeyCount: z.number().optional().default(0),
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
