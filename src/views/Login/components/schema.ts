import { z } from 'zod';

export const loginWithEmailAndPasswordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const loginWithEmailAndPasswordResponseSchema = z.object({
    requires2FAVerification: z.boolean(),
    requires2FASetup: z.boolean().optional(),
    qrCodeUrl: z.string().optional(),
    status: z.string(),
});

export type LoginWithEmailAndPassword = z.infer<typeof loginWithEmailAndPasswordSchema>;
export type LoginWithEmailAndPasswordResponse = z.infer<typeof loginWithEmailAndPasswordResponseSchema>;
