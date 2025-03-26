<template>
  <div class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">Team Members</h3>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            :disabled="!hasPermission(PermissionEnum.USER_WRITE)"
            class="flex items-center gap-2"
          >
            <UserPlus class="h-4 w-4" />
            Add User
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuItem @click="showCreateUserModal = true">
            <UserPlus class="mr-2 h-4 w-4" />
            <span>Create new user</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Upload class="mr-2 h-4 w-4" />
            <span>Import users</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail class="mr-2 h-4 w-4" />
            <span>Send invitation</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <TeamMembers :users="users" />

    <CreateUserModal
      v-model:isOpen="showCreateUserModal"
      @user-created="loadUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Mail, Upload, UserPlus } from 'lucide-vue-next'
import { type UserInput } from '@/views/Settings/components/Team/schema.ts'
import { UserService } from '@/services/user.service.ts'
import TeamMembers from '@/views/Settings/components/Team/TeamMembers.vue'
import CreateUserModal from '@/views/Settings/components/Team/CreateUserModal.vue'
import { usePermissions } from '@/composables/usePermissions.ts'
import { PermissionEnum } from '@/enums/user/user.enum.ts'

const { hasPermission } = usePermissions()
const userService = new UserService()

const showCreateUserModal = ref(false)
const users = ref<UserInput[]>([])

const loadUsers = async () => {
  users.value = await userService.get(userService.resource)
}

onMounted(async () => {
  await loadUsers()
})
</script>
