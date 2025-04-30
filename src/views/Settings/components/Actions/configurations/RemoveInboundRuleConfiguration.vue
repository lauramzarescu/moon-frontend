<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-vue-next';

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

        <FormField :name="`${configPath}.protocol`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Protocol</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="tcp" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField :name="`${configPath}.portRange`" v-slot="{ field }">
            <FormItem>
                <FormLabel>Port / Range</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="e.g., 22, 80, 1000-2000" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField :name="`${configPath}.ip`" v-slot="{ field }">
            <FormItem>
                <FormLabel>IP Address (Optional)</FormLabel>
                <FormControl>
                    <Input v-bind="field" placeholder="127.0.0.1" />
                </FormControl>

                <Alert variant="info" class="mt-4 bg-blue-50 dark:bg-blue-950/30">
                    <div class="flex items-center gap-2">
                        <InfoIcon class="h-4 w-4" />
                        <AlertDescription class="mt-1">
                            If provided, the rule will only apply to the specified IP address, otherwise the rule will apply to the IP
                            address of the executor. Do not leave empty if it's a scheduled job.
                        </AlertDescription>
                    </div>
                </Alert>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
