export interface SamlConfigResponseInterface {
    id: string
    createdAt: Date
    updatedAt: Date
    metadataUrl: string
    entityId: string
    serviceProviderX509Certificate: string
    serviceProviderPrivateKey: string
}
