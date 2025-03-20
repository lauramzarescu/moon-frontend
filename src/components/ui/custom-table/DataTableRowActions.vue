<script setup lang="ts" generic="TData">
import type { Row } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { DotsHorizontalIcon } from '@radix-icons/vue'

interface DataTableRowActionsProps {
    row: Row<TData>
    actions: {
        onClick: (row: Row<TData>) => void
        redirectTo?: string
        enable: boolean
        trigger: string
        shortcut: string
    }[]
}

defineProps<DataTableRowActionsProps>()
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                <DotsHorizontalIcon class="h-4 w-4" />
                <span class="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-[160px]">
            <DropdownMenuItem v-for="action in actions" :disabled="!action.enable" :key="action.trigger">
                <RouterLink v-if="action.redirectTo" :to="action.redirectTo">
                    {{ action.trigger }}
                </RouterLink>
                <span v-else-if="action.onClick" @click="action.onClick">
                    {{ action.trigger }}
                </span>
                <span v-else>
                    {{ action.trigger }}
                </span>
                <DropdownMenuShortcut>{{ action.shortcut }}</DropdownMenuShortcut>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
