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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField :name="`${configPath}.channel`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="#alerts" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>

            <FormField :name="`${configPath}.recipient`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="@username or channel name" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
        </div>

        <FormField :name="`${configPath}.messageTemplate`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Message Template</FormLabel>
                <FormControl>
                    <Textarea v-bind="field" placeholder="User {userId} logged in at {timestamp}." class="min-h-[100px]" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
