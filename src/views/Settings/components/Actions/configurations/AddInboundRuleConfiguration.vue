<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

defineProps<{
    configPath: string;
}>();
</script>

<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField :name="`${configPath}.securityGroupId`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Security Group ID</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="sg-xxxxxxxxxxxxxxxxx" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>

            <FormField :name="`${configPath}.protocol`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="e.g., tcp, udp, icmp" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField :name="`${configPath}.portRange`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Port / Range</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="e.g., 22, 80, 1000-2000" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>

            <FormField :name="`${configPath}.descriptionTemplate`" v-slot="{ field }">
                <FormItem>
                    <FormLabel>Description Template (Optional)</FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="Access for {email} on {timestamp}" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
        </div>
    </div>
</template>
