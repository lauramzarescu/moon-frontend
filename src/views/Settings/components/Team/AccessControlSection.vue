<template>
    <div class="mb-8 p-4 border rounded-lg mt-6">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-lg font-semibold">Access Control</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Restrict access to specific email addresses</p>
            </div>
            <Switch
                v-model:checked="restrictedAccess"
                @update:checked="handleRestrictedAccessToggle"
                :disabled="!hasPermission(PermissionEnum.ACCESS_CONTROL_WRITE)"
            />
        </div>

        <Alert variant="info" class="mt-4 bg-blue-50 dark:bg-blue-950/30" v-if="!restrictedAccess">
            <div class="flex items-center gap-2">
                <InfoIcon class="h-4 w-4" />
                <AlertDescription class="text-muted-foreground">
                    Anyone from your organization can access this application.
                </AlertDescription>
            </div>
        </Alert>

        <div v-if="restrictedAccess" class="mt-4 space-y-4">
            <div class="flex gap-2">
                <Input v-model="newEmail" placeholder="Enter email address" @keyup.enter="addEmail" />
                <Button @click="addEmail" :disabled="!hasPermission(PermissionEnum.ACCESS_CONTROL_WRITE)"> Add </Button>
            </div>

            <div v-if="allowedEmails.length > 0" class="rounded-md border divide-y">
                <div v-for="item in allowedEmails" :key="item.email" class="flex items-center justify-between px-4 py-2">
                    <span class="text-sm font-medium">{{ item.email }}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        @click="removeEmail(item.id)"
                        :disabled="!hasPermission(PermissionEnum.ACCESS_CONTROL_DELETE)"
                    >
                        Remove
                    </Button>
                </div>
            </div>
        </div>
    </div>

    <Dialog v-model:open="showDisableDialog">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Disable Access Control</DialogTitle>
                <DialogDescription class="pt-4">
                    Are you sure? All access control emails will be removed and everyone from your organization will be able to login.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" @click="showDisableDialog = false">Cancel</Button>
                <Button variant="destructive" @click="confirmDisable">Yes, disable</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InfoIcon } from 'lucide-vue-next';
import { type AccessControlInput } from '@/views/Settings/components/Team/schema.ts';
import { AccessControlService } from '@/services/access-control.service.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const { hasPermission } = usePermissions();
const accessControlService = new AccessControlService();

const restrictedAccess = ref(false);
const allowedEmails = ref<AccessControlInput[]>([]);
const newEmail = ref('');
const showDisableDialog = ref(false);

const handleRestrictedAccessToggle = (checked: boolean) => {
    if (!checked && allowedEmails.value.length > 0) {
        showDisableDialog.value = true;
        restrictedAccess.value = true; // Keep it on until confirmed
    }
};

const confirmDisable = async () => {
    await accessControlService.disableAccessControl();
    restrictedAccess.value = false;
    allowedEmails.value = [];
    showDisableDialog.value = false;
};

const addEmail = async () => {
    if (!newEmail.value) return;

    const item = { email: newEmail.value, description: '' };
    await accessControlService.addToList(item);
    await loadAccessControlEmails();
    newEmail.value = '';
};

const removeEmail = async (id: string) => {
    await accessControlService.removeFromList(id);
    await loadAccessControlEmails();
};

const loadAccessControlEmails = async () => {
    allowedEmails.value = await accessControlService.getList();
    restrictedAccess.value = allowedEmails.value.length > 0;
};

onMounted(async () => {
    await loadAccessControlEmails();
});
</script>
