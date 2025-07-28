<template>
    <div class="space-y-4">
        <div>
            <h4 class="text-sm font-medium">Two-Factor Authentication Method</h4>
            <p class="text-sm text-muted-foreground">Choose your preferred 2FA method</p>
        </div>

        <div class="space-y-3">
            <!-- TOTP Method -->
            <div
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.TOTP
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.TOTP)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                        <SmartphoneIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">Authenticator App (TOTP)</p>
                        <p class="text-xs text-muted-foreground">Use Google Authenticator, Authy, or similar apps</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge v-if="totpEnabled" variant="secondary" class="text-xs"> Configured</Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.TOTP ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.TOTP" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>

            <!-- YubiKey Method -->
            <div
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.YUBIKEY
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.YUBIKEY)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <ShieldCheckIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">YubiKey</p>
                        <p class="text-xs text-muted-foreground">Use a physical YubiKey device</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge v-if="yubikeyCount > 0" variant="secondary" class="text-xs">
                        {{ yubikeyCount }} key{{ yubikeyCount !== 1 ? 's' : '' }}
                    </Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.YUBIKEY ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.YUBIKEY" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>

            <!-- Any Method -->
            <div
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.ANY
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.ANY)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                        <ShieldIcon class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">Any Method</p>
                        <p class="text-xs text-muted-foreground">Accept either TOTP or YubiKey for authentication</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge v-if="totpEnabled && yubikeyCount > 0" variant="secondary" class="text-xs"> Available </Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.ANY ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.ANY" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
            <Button @click="saveMethod" :disabled="!hasChanges || isLoading || !canSelectMethod" size="sm">
                <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                Save Method
            </Button>
        </div>

        <!-- Requirements Notice -->
        <div v-if="!canSelectMethod" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
            <div class="flex items-start gap-2">
                <AlertTriangleIcon class="h-4 w-4 text-yellow-600 mt-0.5" />
                <div class="text-sm">
                    <p class="font-medium text-yellow-800 dark:text-yellow-200">Setup Required</p>
                    <p class="text-yellow-700 dark:text-yellow-300">
                        {{ getRequirementMessage() }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon, Loader2Icon, ShieldCheckIcon, ShieldIcon, SmartphoneIcon } from 'lucide-vue-next';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import { UserService } from '@/services/user.service.ts';
import { toast } from '@/components/ui/toast';

const props = defineProps<{
    currentMethod: TwoFactorMethod | null;
    totpEnabled: boolean;
    yubikeyCount: number;
}>();

const emit = defineEmits<{
    'method-updated': [method: TwoFactorMethod];
}>();

const userService = new UserService();

const selectedMethod = ref<TwoFactorMethod>(props.currentMethod || TwoFactorMethod.TOTP);
const isLoading = ref(false);

const hasChanges = computed(() => {
    return selectedMethod.value !== props.currentMethod;
});

const canSelectMethod = computed(() => {
    switch (selectedMethod.value) {
        case TwoFactorMethod.TOTP:
            return props.totpEnabled;
        case TwoFactorMethod.YUBIKEY:
            return props.yubikeyCount > 0;
        case TwoFactorMethod.ANY:
            return props.totpEnabled && props.yubikeyCount > 0;
        default:
            return false;
    }
});

const selectMethod = (method: TwoFactorMethod) => {
    selectedMethod.value = method;
};

const getRequirementMessage = () => {
    switch (selectedMethod.value) {
        case TwoFactorMethod.TOTP:
            return 'Please set up TOTP authentication first.';
        case TwoFactorMethod.YUBIKEY:
            return 'Please register at least one YubiKey first.';
        case TwoFactorMethod.ANY:
            if (!props.totpEnabled && props.yubikeyCount === 0) {
                return 'Please set up both TOTP authentication and register a YubiKey.';
            } else if (!props.totpEnabled) {
                return 'Please set up TOTP authentication first.';
            } else {
                return 'Please register at least one YubiKey first.';
            }
        default:
            return '';
    }
};

const saveMethod = async () => {
    if (!canSelectMethod.value) return;

    try {
        isLoading.value = true;
        await userService.setTwoFactorMethod({
            method: selectedMethod.value,
        });

        emit('method-updated', selectedMethod.value);

        toast({
            title: '2FA method updated',
            description: 'Your two-factor authentication method has been updated successfully.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error updating 2FA method:', error);
        toast({
            title: 'Error updating method',
            description: 'Failed to update your 2FA method. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.currentMethod,
    (newMethod) => {
        if (newMethod) {
            selectedMethod.value = newMethod;
        }
    },
    { immediate: true }
);

// Watch for changes in props that affect available methods
watch(
    () => [props.yubikeyCount, props.totpEnabled],
    () => {
        // Force reactivity update when available methods change
        // This ensures the UI updates when YubiKeys are added/removed
    },
    { deep: true }
);
</script>
