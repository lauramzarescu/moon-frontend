<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <h4 class="text-sm font-medium">Security Key Management</h4>
                <p class="text-sm text-muted-foreground">Manage your registered YubiKeys and WebAuthn security keys</p>
            </div>
            <div class="flex gap-2">
                <Button
                    @click="showAddModal = true"
                    size="sm"
                    variant="outline"
                    :disabled="hasHighSecurityMethods"
                    :title="hasHighSecurityMethods ? 'OTP YubiKey registration disabled when high-security methods are available' : ''"
                >
                    <PlusIcon class="h-4 w-4 mr-2" />
                    Add YubiKey (OTP)
                </Button>
                <Button @click="showWebAuthnModal = true" size="sm" variant="outline">
                    <PlusIcon class="h-4 w-4 mr-2" />
                    Add WebAuthn Key
                </Button>
            </div>
        </div>

        <!-- Security Warning -->
        <div v-if="hasHighSecurityMethods" class="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <div class="flex items-start gap-2">
                <ShieldCheckIcon class="h-4 w-4 text-blue-600 mt-0.5" />
                <div class="text-sm">
                    <p class="font-medium text-blue-800 dark:text-blue-200 mb-1">High Security Mode Active</p>
                    <p class="text-blue-700 dark:text-blue-300">
                        OTP YubiKey registration is disabled because you have high-security methods (Mobile Auth or WebAuthn) configured.
                        This prevents security downgrade attacks.
                    </p>
                </div>
            </div>
        </div>

        <!-- YubiKeys List -->
        <div v-if="yubikeys.length > 0" class="space-y-2">
            <div v-for="yubikey in yubikeys" :key="yubikey.id" class="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <ShieldCheckIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">
                            {{ yubikey.nickname || `YubiKey ${yubikey.publicId.slice(-4)}` }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                            ID: {{ yubikey.publicId.slice(-12) }}... • Added {{ formatDate(yubikey.createdAt) }}
                        </p>
                        <p v-if="yubikey.lastUsed" class="text-xs text-muted-foreground">Last used: {{ formatDate(yubikey.lastUsed) }}</p>
                    </div>
                </div>
                <Button
                    @click="handleRemoveYubikey(yubikey)"
                    size="sm"
                    variant="ghost"
                    class="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2Icon class="h-4 w-4" />
                </Button>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 border-2 border-dashed border-muted rounded-lg">
            <ShieldOffIcon class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-sm text-muted-foreground mb-2">No YubiKeys registered</p>
            <Button @click="showAddModal = true" size="sm" variant="outline">
                <PlusIcon class="h-4 w-4 mr-2" />
                Add Your First YubiKey
            </Button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-4">
            <Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    </div>

    <!-- Add YubiKey Modal -->
    <YubikeySetupModal v-model:open="showAddModal" @setup-complete="handleSetupComplete" />

    <!-- WebAuthn Setup Modal -->
    <WebAuthnSetupModal v-model:open="showWebAuthnModal" @setup-complete="handleSetupComplete" />

    <!-- Remove Confirmation Dialog -->
    <Dialog v-model:open="showRemoveDialog">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Remove YubiKey</DialogTitle>
                <DialogDescription> Are you sure you want to remove this YubiKey? This action cannot be undone. </DialogDescription>
            </DialogHeader>

            <div v-if="yubikeyToRemove" class="p-3 bg-muted rounded-lg">
                <p class="text-sm font-medium">
                    {{ yubikeyToRemove.nickname || `YubiKey ${yubikeyToRemove.publicId.slice(-4)}` }}
                </p>
                <p class="text-xs text-muted-foreground">ID: {{ yubikeyToRemove.publicId.slice(-12) }}...</p>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="showRemoveDialog = false" :disabled="isRemoving"> Cancel</Button>
                <Button variant="destructive" @click="confirmRemoveYubikey" :disabled="isRemoving">
                    <Loader2Icon v-if="isRemoving" class="w-4 h-4 mr-2 animate-spin" />
                    Remove YubiKey
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon, PlusIcon, ShieldCheckIcon, ShieldOffIcon, Trash2Icon } from 'lucide-vue-next';
import { UserService } from '@/services/user.service.ts';
import type { YubikeyInfo } from '@/views/Settings/components/Account/schema.ts';
import YubikeySetupModal from './YubikeySetupModal.vue';
import WebAuthnSetupModal from './WebAuthnSetupModal.vue';
import { toast } from '@/components/ui/toast';
import { YubikeyAuthType } from '@/enums/user/user.enum.ts';

const emit = defineEmits<{
    'yubikeys-updated': [count: number];
}>();

const userService = new UserService();

const yubikeys = ref<YubikeyInfo[]>([]);
const isLoading = ref(false);
const showAddModal = ref(false);
const showWebAuthnModal = ref(false);
const showRemoveDialog = ref(false);
const yubikeyToRemove = ref<YubikeyInfo | null>(null);
const isRemoving = ref(false);

// Security hierarchy - check if high-security methods exist
const hasHighSecurityMethods = computed(() => {
    const hasWebAuthn = yubikeys.value.some((key) => key.authType === YubikeyAuthType.WEBAUTHN || key.credentialId);
    // Note: We would need TOTP status from parent component for complete check
    // For now, just check WebAuthn
    return hasWebAuthn;
});

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
};

const loadYubikeys = async () => {
    try {
        isLoading.value = true;
        const response = await userService.getUserYubikeys();
        yubikeys.value = response.data || [];

        emit('yubikeys-updated', yubikeys.value.length);
    } catch (error) {
        console.error('Error loading YubiKeys:', error);
        toast({
            title: 'Error loading YubiKeys',
            description: 'Failed to load your registered YubiKeys.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

const handleSetupComplete = async (success: boolean) => {
    if (success) {
        await loadYubikeys();
        toast({
            title: 'YubiKey added',
            description: 'Your YubiKey has been successfully registered.',
            variant: 'success',
        });
    }
};

const handleRemoveYubikey = (yubikey: YubikeyInfo) => {
    yubikeyToRemove.value = yubikey;
    showRemoveDialog.value = true;
};

const confirmRemoveYubikey = async () => {
    if (!yubikeyToRemove.value) return;

    try {
        isRemoving.value = true;
        await userService.removeYubikey({
            yubikeyId: yubikeyToRemove.value.id,
        });

        await loadYubikeys();
        showRemoveDialog.value = false;
        yubikeyToRemove.value = null;

        toast({
            title: 'YubiKey removed',
            description: 'The YubiKey has been successfully removed from your account.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error removing YubiKey:', error);
        toast({
            title: 'Error removing YubiKey',
            description: 'Failed to remove the YubiKey. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isRemoving.value = false;
    }
};

onMounted(async () => {
    await loadYubikeys();
});
</script>
