import * as z from 'zod';

export const twoFactorStatusSchema = z.object({
    enabled: z.boolean(),
    verified: z.boolean(),
});

export const twoFactorSetupResponseSchema = z.object({
    qrCode: z.string(),
    secret: z.string(),
});

export type TwoFactorStatus = z.infer<typeof twoFactorStatusSchema>;
export type TwoFactorSetupResponse = z.infer<typeof twoFactorSetupResponseSchema>;
