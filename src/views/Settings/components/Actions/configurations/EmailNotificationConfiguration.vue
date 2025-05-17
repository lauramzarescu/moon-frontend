<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

defineProps<{
    configPath: string;
}>();
</script>

<template>
    <div class="space-y-4">
        <FormField :name="`${configPath}.email`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="admin@example.com" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField :name="`${configPath}.subject`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="Service alert" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField :name="`${configPath}.body`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Body</FormLabel>
                <FormControl>
                    <Textarea v-bind="field" placeholder="User {userId} logged in." class="min-h-[100px]" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
