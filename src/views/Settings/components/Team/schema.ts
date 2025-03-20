import { z } from 'zod'
import { LoginType, UserRole } from '@/enums/user/user.enum.ts'

/** ================================ */
/** ======== User schema =========== */
/** ================================ */
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
})

export const userDetailsResponseSchema = userSchema
  .omit({
    lastLogin: true,
    nameID: true,
    nameIDFormat: true,
    sessionIndex: true,
    twoFactorSecret: true,
  })

export const userCreateSchema = userSchema
  .omit({
    lastLogin: true,
    nameID: true,
    sessionIndex: true,
  })
  .partial({
    organizationId: true,
  })

export const userUpdateSchema = userCreateSchema
export type UserInput = z.infer<typeof userSchema>
export type UserDetailsResponseInput = z.infer<typeof userDetailsResponseSchema>

/** ================================ */
/** ===== Access control schema ==== */
/** ================================ */
export const accessControlSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  description: z.string().optional(),
  isAllowed: z.boolean().default(true),
})

export const accessControlCreateSchema = accessControlSchema.omit({
  id: true,
  organizationId: true,
  isAllowed: true,
})

export type AccessControlInput = z.infer<typeof accessControlSchema>
export type AccessControlCreateInput = z.infer<typeof accessControlCreateSchema>
