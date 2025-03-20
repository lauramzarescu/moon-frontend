<template>
    <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
                {{ title }}
            </CardTitle>
            <slot name="icon">
                <component :is="icon" v-if="icon" class="h-4 w-4 text-muted-foreground" />
                <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    class="h-4 w-4 text-muted-foreground"
                >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            </slot>
        </CardHeader>
        <CardContent>
            <div class="text-2xl font-bold">
                {{ value }}
            </div>
            <p class="text-xs text-muted-foreground">
                {{ description }}
            </p>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Component } from 'vue'

defineProps<{
    title: string
    value: string | number
    description?: string
    icon?: Component
}>()
</script>
