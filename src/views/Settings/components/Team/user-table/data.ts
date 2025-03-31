import { LoginType } from '@/enums/user/user.enum.ts';
import { BuildingIcon, KeyRoundIcon } from 'lucide-vue-next';

export const loginTypes = [
    {
        value: LoginType.saml,
        label: 'SAML',
        color: 'bg-yellow-200 text-yellow-800',
        icon: BuildingIcon,
    },
    {
        value: LoginType.local,
        label: 'Local',
        color: 'bg-blue-200 text-blue-800',
        icon: KeyRoundIcon,
    },
];
