import { TwoFactorMethod, YubikeyAuthType } from '@/enums/user/user.enum.ts';
import type { Ref } from 'vue';

export interface TwoFactorMethodState {
    useYubikey: Ref<boolean>;
    useYubikeyWebAuthn: Ref<boolean>;
    useWebAuthn?: Ref<boolean>;
}

export interface TwoFactorAvailability {
    hasTotp: Ref<boolean>;
    hasYubikeyOTP: Ref<boolean>;
    hasYubikeyWebAuthn?: Ref<boolean>;
    hasWebAuthn?: Ref<boolean>;
    hasYubikey?: Ref<boolean>;
    yubikeyAuthType?: Ref<YubikeyAuthType | null>;
}

export const setInitialVerificationMethod = (
    twoFactorMethod: Ref<TwoFactorMethod | null>,
    availability: TwoFactorAvailability,
    state: TwoFactorMethodState,
) => {
    state.useYubikey.value = false;
    state.useYubikeyWebAuthn.value = false;
    if (state.useWebAuthn) {
        state.useWebAuthn.value = false;
    }

    switch (twoFactorMethod.value) {
        case TwoFactorMethod.YUBIKEY:
            // Determine YubiKey type based on available methods
            const hasWebAuthnCapability = availability.hasYubikeyWebAuthn?.value || availability.hasWebAuthn?.value;
            const hasOTPCapability = availability.hasYubikeyOTP.value;

            if (availability.yubikeyAuthType?.value === YubikeyAuthType.WEBAUTHN || hasWebAuthnCapability) {
                if (state.useWebAuthn) {
                    state.useWebAuthn.value = true;
                } else {
                    state.useYubikeyWebAuthn.value = true;
                }
            } else if (hasOTPCapability) {
                state.useYubikey.value = true;
            } else {
                state.useYubikey.value = true;
            }
            break;

        case TwoFactorMethod.TOTP:
            // All states already reset to false
            break;

        case TwoFactorMethod.ANY:
            // For ANY method, prefer high-security methods but default to TOTP
            const hasWebAuthnAny = availability.hasYubikeyWebAuthn?.value || availability.hasWebAuthn?.value;

            if (hasWebAuthnAny) {
                if (state.useWebAuthn) {
                    state.useWebAuthn.value = true;
                } else {
                    state.useYubikeyWebAuthn.value = true;
                }
            } else if (availability.hasTotp.value) {
                // Default to TOTP (all false)
            } else if (availability.hasYubikeyOTP.value) {
                state.useYubikey.value = true;
            }
            // Otherwise defaults to TOTP (all false)
            break;

        default:
            // All states already reset to false
            break;
    }
};
