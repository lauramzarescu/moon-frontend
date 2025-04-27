<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

defineProps<{
    configPath: string;
}>();
</script>

<template>
    <div class="space-y-4">
        <FormField :name="`${configPath}.securityGroupId`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Security Group ID</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="sg-xxxxxxxxxxxxxxxxx" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
