export enum SidebarSection {
    AWS = 'aws',
    DigitalOcean = 'digital-ocean',
    GoogleCloud = 'google-cloud',
    Settings = 'settings',
}

export interface SidebarItem {
    path: string;
    name: string;
    icon: string;
    section: SidebarSection;
    active?: boolean;
}
