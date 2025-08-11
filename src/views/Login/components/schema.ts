import { z } from 'zod';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';

export const loginWithEmailAndPasswordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const loginWithEmailAndPasswordResponseSchema = z.object({
    requires2FAVerification: z.boolean().optional().default(false),
    requires2FASetup: z.boolean().optional().default(false),
    qrCodeUrl: z.string().optional(),
    status: z.string(),
    twoFactorMethod: z.string().optional().nullable(), // More flexible - accept any string
    // Security hierarchy fields - all optional with defaults
    hasTotp: z.boolean().optional().default(false),
    hasWebAuthn: z.boolean().optional().default(false),
    hasYubikey: z.boolean().optional().default(false),
    hasYubikeyOTP: z.boolean().optional().default(false),
    availableMethods: z.array(z.string()).optional().default([]), // More flexible - accept any strings
}).passthrough(); // Allow additional fields that we don't know about

export type LoginWithEmailAndPassword = z.infer<typeof loginWithEmailAndPasswordSchema>;
export type LoginWithEmailAndPasswordResponse = z.infer<typeof loginWithEmailAndPasswordResponseSchema>;
