import { z } from 'zod';

export const organizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    enforce2FA: z.boolean(),
});

export const organizationResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    enforce2FA: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const updateOrganizationSchema = z.object({
    enforce2FA: z.boolean(),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type OrganizationDetailsResponse = z.infer<typeof organizationResponseSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const organizationPageConfig = {
    title: 'Organization Settings',
    description: 'Manage your organization settings and security policies',
    fields: {
        name: {
            label: 'Organization Name',
            type: 'text',
            readonly: true,
            description: 'The name of your organization',
        },
        enforce2FA: {
            label: 'Enforce Two-Factor Authentication',
            type: 'checkbox',
            description: 'Require all users in this organization to enable 2FA',
        },
    },
};
