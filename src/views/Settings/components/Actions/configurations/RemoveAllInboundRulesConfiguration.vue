<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';
import { getRemoveAllInboundRulesAlerts } from '../utils/actionAlerts';
import { computed } from 'vue';
import type { RemoveAllInboundRulesConfig } from '@/views/Settings/components/Actions/schema.ts';

const props = defineProps<{
    configPath: string;
    config: RemoveAllInboundRulesConfig;
}>();

const alerts = computed(() => {
    const config = props.config[props.configPath as keyof typeof props.config] || {};
    return getRemoveAllInboundRulesAlerts(config);
});
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

        <div v-if="alerts.length > 0">
            <Alert variant="warning" v-for="(alert, index) in alerts" :key="index" class="mb-2">
                <AlertCircle class="h-4 w-4 mr-2" />
                <AlertDescription>{{ alert.message }}</AlertDescription>
            </Alert>
        </div>

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
                    <Input v-bind="field" placeholder="e.g., 22, 80, 1000-2000" @update:modelValue="field.onChange" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
