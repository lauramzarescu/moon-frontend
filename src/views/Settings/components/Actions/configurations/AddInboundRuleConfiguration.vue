<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-vue-next';

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
                    <FormLabel>
                        Description Template (Optional)
                        <TooltipProvider :delay-duration="0">
                            <Tooltip>
                                <TooltipTrigger as="span" class="inline-flex align-text-bottom ml-1 cursor-pointer">
                                    <InfoIcon class="h-4 w-4 text-foreground hover:text-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent class="max-w-xs p-4 text-sm">
                                    <p class="font-medium mb-2">Available variables:</p>
                                    <ul class="space-y-1">
                                        <li><code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{ip}</code> - IP address</li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{fromPort}</code>
                                            - Starting port
                                        </li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{toPort}</code>
                                            - Ending port
                                        </li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{portRange}</code>
                                            - Full port range
                                        </li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{protocol}</code>
                                            - Protocol used
                                        </li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{timestamp}</code>
                                            - Current time
                                        </li>
                                        <li>
                                            <code class="bg-gray-400 dark:border-gray-800 px-1 py-0.5 rounded">{email}</code>
                                            - User email
                                        </li>
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                        <Input v-bind="field" placeholder="Access for {email} on {timestamp}" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
        </div>
    </div>
</template>
