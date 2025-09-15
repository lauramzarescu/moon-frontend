<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { UserService } from '@/services/user.service.ts';
import type { UserDeviceInfo } from '@/views/Settings/components/Team/schema.ts';
import { Trash2Icon } from 'lucide-vue-next';

const userService = new UserService();
const devices = ref<UserDeviceInfo[]>([]);
const loading = ref(false);
const removing = ref<string | null>(null);

const props = defineProps<{
    twoFactorEnabled: boolean;
}>();

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
}

function getBrowserInfo(userAgent?: string) {
    if (!userAgent) return 'Unknown Browser';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
}

function getDeviceType(userAgent?: string) {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
}

async function loadDevices() {
    if (!props.twoFactorEnabled) return;

    try {
        loading.value = true;
        devices.value = await userService.getAuthorizedDevices();
    } catch (error) {
        console.error('Error loading authorized devices:', error);
    } finally {
        loading.value = false;
    }
}

async function removeDevice(deviceId: string) {
    loading.value = true;

    try {
        removing.value = deviceId;
        await userService.removeDevice(deviceId);

        setTimeout(async () => await loadDevices(), 301); // 300 is the debounce time in generic.service.ts
    } catch (error) {
        console.error('Error removing device:', error);
    } finally {
        removing.value = null;
    }
}

onMounted(async () => {
    await loadDevices();
});

watch(
    () => props.twoFactorEnabled,
    (newValue) => {
        if (newValue) {
            loadDevices();
        } else {
            devices.value = [];
        }
    },
);
</script>

<template>
    <div v-if="twoFactorEnabled" class="space-y-4">
        <Separator />

        <div>
            <h4 class="text-base font-medium">Authorized Devices</h4>
            <p class="text-sm text-muted-foreground">Manage devices that are authorized for two-factor authentication</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="devices.length === 0" class="text-center py-8 text-muted-foreground">No authorized devices found</div>

        <div v-else class="space-y-3">
            <div v-for="device in devices" :key="device.id" class="bg-card flex items-center justify-between p-4 border rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-medium">{{ getBrowserInfo(device.userAgent) }}</span>
                        <span class="text-sm text-muted-foreground">•</span>
                        <span class="text-sm text-muted-foreground">{{ getDeviceType(device.userAgent) }}</span>
                    </div>

                    <div class="text-sm text-muted-foreground">Last verified: {{ formatDate(device.lastVerified) }}</div>

                    <div class="text-xs text-muted-foreground mt-1">Device ID: {{ device.fingerprint }}</div>
                </div>

                <Button
                    @click="removeDevice(device.id)"
                    :disabled="removing === device.id"
                    size="sm"
                    variant="ghost"
                    class="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2Icon class="h-4 w-4" />
                </Button>
            </div>
        </div>
    </div>
</template>
