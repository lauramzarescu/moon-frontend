<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { h, onMounted, ref } from 'vue'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Info } from 'lucide-vue-next'
import { type AccessControlInput, type UserInput } from '@/views/Settings/components/Team/schema.ts'
import { UserService } from '@/services/user.service.ts'
import TeamMembers from '@/views/Settings/components/Team/TeamMembers.vue'
import { AccessControlService } from '@/services/access-control.service.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { PermissionEnum } from '@/enums/user/user.enum.ts'

const { hasPermission } = usePermissions()
const userService = new UserService()
const accessControlService = new AccessControlService()

const showPasswordModal = ref(false)
const restrictedAccess = ref(false)
const allowedEmails = ref<AccessControlInput[]>([])
const newEmail = ref('')
const showDisableDialog = ref(false)

const users = ref<UserInput[]>([])

const accountFormSchema = toTypedSchema(
  z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
  }),
)

const passwordFormSchema = toTypedSchema(
  z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords don\'t match',
      path: ['confirmPassword'],
    }),
)

const handleRestrictedAccessToggle = (checked: boolean) => {
  if (!checked && allowedEmails.value.length > 0) {
    showDisableDialog.value = true
    restrictedAccess.value = true // Keep it on until confirmed
  }
}

const confirmDisable = async () => {
  await accessControlService.disableAccessControl()
  restrictedAccess.value = false
  allowedEmails.value = []
  showDisableDialog.value = false
}

const addEmail = async () => {
  if (!newEmail.value) return

  const item = { email: newEmail.value, description: '' }
  await accessControlService.addToList(item)
  await loadAccessControlEmails()
}

const removeEmail = async (id: string) => {
  await accessControlService.removeFromList(id)
  await loadAccessControlEmails()
}

const onSubmit = (values: any) => {
  toast({
    title: 'Account updated successfully',
    description: h(
      'pre',
      { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' },
      h('code', { class: 'text-white' }, JSON.stringify(values, null, 2)),
    ),
  })
}

const onPasswordSubmit = (values: any) => {
  showPasswordModal.value = false
  toast({
    title: 'Password changed successfully',
    description: 'Your password has been updated.',
  })
}

const loadUsers = async () => {
  users.value = await userService.get(userService.resource)
}

const loadAccessControlEmails = async () => {
  allowedEmails.value = await accessControlService.getList()
  restrictedAccess.value = allowedEmails.value.length > 0
}

onMounted(async () => {
  await loadUsers()
  await loadAccessControlEmails()
})
</script>

<template>
  <div>
    <h3 class="pt-5 text-lg font-medium">Team Management</h3>
    <p class="text-sm text-muted-foreground">Manage system users and their roles.</p>
  </div>
  <Separator />

  <Dialog v-model:open="showDisableDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Disable Access Control</DialogTitle>
        <DialogDescription class="pt-4">
          Are you sure? All access control emails will be removed and everyone from your
          organization will be able to login.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="showDisableDialog = false">Cancel</Button>
        <Button variant="destructive" @click="confirmDisable">Yes, disable</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Access Control Card -->
  <div class="mb-8 p-4 border rounded-lg mt-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Access Control</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Restrict access to specific email
          addresses</p>
      </div>
      <Switch
        v-model:checked="restrictedAccess"
        @update:checked="handleRestrictedAccessToggle"
        :disabled="!hasPermission(PermissionEnum.ACCESS_CONTROL_WRITE)"
      />
    </div>

    <Alert variant="info" class="mt-4" v-if="!restrictedAccess">
      <AlertDescription class="flex items-center gap-2">
        <Info class="h-4 w-4" />
        Anyone from your organization can access this application
      </AlertDescription>
    </Alert>

    <div v-if="restrictedAccess" class="mt-4 space-y-4">
      <div class="flex gap-2">
        <Input v-model="newEmail" placeholder="Enter email address" @keyup.enter="addEmail" />
        <Button @click="addEmail" :disabled="!hasPermission(PermissionEnum.ACCESS_CONTROL_WRITE)">
          Add
        </Button>
      </div>

      <div v-if="allowedEmails.length > 0" class="rounded-md border divide-y">
        <div v-for="item in allowedEmails" :key="item.email"
             class="flex items-center justify-between px-4 py-2">
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

  <div class="space-y-8">
    <div class="mt-8">
      <TeamMembers :users="users" />
      <!--      <DataTable-->
      <!--        :data="users.data"-->
      <!--        :columns="columns"-->
      <!--        :total-rows="users.meta.total"-->
      <!--        :config="{-->
      <!--          toolbarComponent: TeamTableToolbar-->
      <!--        }"-->
      <!--        :options="[]"-->
      <!--        @pagination-change="handlePaginationChange"-->
      <!--      />-->
    </div>
  </div>

  <!-- Password Change Modal -->
  <Dialog v-model:open="showPasswordModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
      </DialogHeader>

      <Form v-slot="{ setFieldValue }" :validation-schema="passwordFormSchema" class="space-y-4"
            @submit="onPasswordSubmit">
        <FormField v-slot="{ componentField }" name="currentPassword">
          <FormItem>
            <FormLabel>Current Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Enter current password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="newPassword">
          <FormItem>
            <FormLabel>New Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Enter new password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>Confirm New Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Confirm new password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button variant="outline" @click="showPasswordModal = false">Cancel</Button>
          <Button type="submit">Change Password</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  </Dialog>
</template>
