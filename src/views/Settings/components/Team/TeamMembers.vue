<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ref, watch } from 'vue'
import { ChevronDownIcon } from '@radix-icons/vue'
import { PermissionEnum, UserRole } from '@/enums/user/user.enum'
import type { UserInput } from './schema'
import { usePermissions } from '@/composables/usePermissions.ts'
import { UserService } from '@/services/user.service.ts'
import { toast } from '@/components/ui/toast'

const { hasPermission } = usePermissions()
const userService = new UserService()

const props = defineProps<{
  users: UserInput[]
}>()

const userRoles = ref<Record<string, UserRole>>({})

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const getRoleDescription = (role: UserRole) => {
  const descriptions = {
    [UserRole.root]: 'Full system access with all permissions',
    [UserRole.admin]: 'Administrative access to manage users and settings',
    [UserRole.user]: 'Standard user access to system features',
  }
  return descriptions[role]
}

const handleRoleChange = (user: UserInput, newRole: UserRole) => {
  userRoles.value[user.id] = newRole

  try {
    userService.updateUser(user.id, { ...user, role: newRole })
    toast({
      title: 'User role updated',
      description: `The role for ${user.name || user.nameIDFormat} has been updated to ${newRole}.`,
      variant: 'success',
    })
  } catch (error) {
    console.error(error)
    toast({
      title: 'Error updating user role',
      description: 'An error occurred while updating the user role. Please try again.',
      variant: 'destructive',
    })
  }
}

watch(
  () => props.users,
  (newUsers) => {
    newUsers.forEach((user) => {
      userRoles.value[user.id] = user.role
    })
  },
  { immediate: true },
)
</script>

<template>
  <Card class="border rounded-lg">
    <CardHeader>
      <CardTitle>Team Members</CardTitle>
      <CardDescription> Invite your team members to collaborate.</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6">
      <div v-for="user in users" :key="user.id" class="flex items-center justify-between space-x-4">
        <div class="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>{{ getInitials(user?.name || user?.nameIDFormat || 'NA') }}
            </AvatarFallback>
          </Avatar>
          <div>
            <p class="text-sm font-medium leading-none">
              {{ user?.name || user?.nameIDFormat }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ user.email }}
            </p>
          </div>
        </div>
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" class="ml-auto">
              {{ userRoles[user.id] }}
              <ChevronDownIcon class="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="p-0" align="end">
            <Command>
              <CommandInput placeholder="Select new role..." />
              <CommandList>
                <CommandEmpty>No roles found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    v-for="role in Object.values(UserRole)"
                    :key="role"
                    :value="role"
                    :disabled="!hasPermission(PermissionEnum.USER_WRITE)"
                    @select="() => handleRoleChange(user, role)"
                    class="space-y-1 flex flex-col items-start px-4 py-2"
                  >
                    <p>{{ role }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ getRoleDescription(role) }}
                    </p>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </CardContent>
  </Card>
</template>
