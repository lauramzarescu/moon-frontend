import { z } from 'zod'

export const samlConfigSchema = z.object({
  id: z.string().optional(),
  metadataUrl: z
    .string({
      required_error: 'Metadata URL is required',
      invalid_type_error: 'Metadata URL must be a string',
    })
    .url('Must be a valid URL'),
  privateKey: z
    .string({
      required_error: 'Private key is required',
      invalid_type_error: 'Private key must be a string',
    })
    .min(1, 'Private key cannot be empty')
    .regex(
      /^-----BEGIN PRIVATE KEY-----\n([A-Za-z0-9+/]{64}\n)*([A-Za-z0-9+/]{1,63}[=]{0,2})?\n-----END PRIVATE KEY-----$/,
      'Invalid private key format - must be a valid PEM format',
    ),
  x509Certificate: z
    .string({
      required_error: 'X.509 Certificate is required',
      invalid_type_error: 'X.509 Certificate must be a string',
    })
    .min(1, 'X.509 Certificate cannot be empty'),
  entityId: z
    .string({
      required_error: 'Entity ID is required',
      invalid_type_error: 'Entity ID must be a string',
    })
    .min(1, 'Entity ID cannot be empty'),
})

export const createPartialUpdateSchema = (changedFields: Record<string, boolean>) => {
  let schema = z.object({
    id: z.string().optional(),
  })

  if (changedFields.metadataUrl) {
    schema = schema.extend({
      metadataUrl: z
        .string({
          required_error: 'Metadata URL is required',
          invalid_type_error: 'Metadata URL must be a string',
        })
        .url('Must be a valid URL'),
    })
  }

  if (changedFields.entityId) {
    schema = schema.extend({
      entityId: z
        .string({
          required_error: 'Entity ID is required',
          invalid_type_error: 'Entity ID must be a string',
        })
        .min(1, 'Entity ID cannot be empty'),
    })
  }

  if (changedFields.x509Certificate) {
    schema = schema.extend({
      x509Certificate: z
        .string({
          required_error: 'X.509 Certificate is required',
          invalid_type_error: 'X.509 Certificate must be a string',
        })
        .min(1, 'X.509 Certificate cannot be empty'),
    })
  }

  if (changedFields.privateKey) {
    schema = schema.extend({
      privateKey: z
        .string({
          required_error: 'Private key is required',
          invalid_type_error: 'Private key must be a string',
        })
        .min(1, 'Private key cannot be empty')
        .regex(
          /^-----BEGIN PRIVATE KEY-----\n([A-Za-z0-9+/]{64}\n)*([A-Za-z0-9+/]{1,63}[=]{0,2})?\n-----END PRIVATE KEY-----$/,
          'Invalid private key format - must be a valid PEM format',
        ),
    })
  }

  return schema
}


export type SamlConfigInput = z.infer<typeof samlConfigSchema>
