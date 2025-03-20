<!--<template>-->
<!--  <Card class="overflow-hidden">-->
<!--    <div class="flex">-->
<!--      <div class="w-2 h-full bg-primary"></div>-->
<!--      <div class="flex-1">-->
<!--        <CardHeader class="py-3">-->
<!--          <div class="flex items-center justify-between">-->
<!--            <div class="flex items-center gap-2">-->
<!--              <div class="p-2 rounded-lg bg-primary/10">-->
<!--                <SettingsIcon class="w-4 h-4 text-primary" />-->
<!--              </div>-->
<!--              <div>-->
<!--                <CardTitle class="text-base">Environment Configuration</CardTitle>-->
<!--                <CardDescription class="text-xs">{{ props.row.taskDefinition.family }}-->
<!--                </CardDescription>-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </CardHeader>-->

<!--        <CardContent>-->
<!--          &lt;!&ndash; Environment Variables Section &ndash;&gt;-->
<!--          <div class="mb-6">-->
<!--            <div class="flex items-center gap-2 mb-4">-->
<!--              <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">-->
<!--                <GlobeIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />-->
<!--              </div>-->
<!--              <span class="font-medium">Public Environment Variables</span>-->
<!--            </div>-->
<!--            <Table>-->
<!--              <TableHeader>-->
<!--                <TableRow class="hover:bg-transparent">-->
<!--                  <TableHead class="w-1/3 text-primary">Name</TableHead>-->
<!--                  <TableHead class="w-2/3 text-primary">Value</TableHead>-->
<!--                </TableRow>-->
<!--              </TableHeader>-->
<!--              <TableBody>-->
<!--                <TableRow-->
<!--                  v-for="env in props.row.taskDefinition.environmentVariables.environment"-->
<!--                  :key="env.name"-->
<!--                  class="hover:bg-muted/10">-->
<!--                  <TableCell class="font-medium group">-->
<!--                    <div class="flex items-center gap-2">-->
<!--                      <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">-->
<!--                        <GlobeIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />-->
<!--                      </div>-->
<!--                      {{ env.name }}-->
<!--                      <button-->
<!--                        @click="copyToClipboard(env.name)"-->
<!--                        class="invisible group-hover:visible hover:text-primary transition-colors">-->
<!--                        <CopyIcon class="h-4 w-4" />-->
<!--                      </button>-->
<!--                    </div>-->
<!--                  </TableCell>-->
<!--                  <TableCell class="group">-->
<!--                    <div class="flex items-center gap-2">-->
<!--                      <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ env.value-->
<!--                        }}</span>-->
<!--                      <button-->
<!--                        @click="copyToClipboard(env.value)"-->
<!--                        class="invisible group-hover:visible hover:text-primary transition-colors">-->
<!--                        <CopyIcon class="h-4 w-4" />-->
<!--                      </button>-->
<!--                    </div>-->
<!--                  </TableCell>-->
<!--                </TableRow>-->
<!--              </TableBody>-->
<!--            </Table>-->
<!--          </div>-->

<!--          &lt;!&ndash; Secrets Section &ndash;&gt;-->
<!--          <div>-->
<!--            <div class="flex items-center gap-2 mb-4">-->
<!--              <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">-->
<!--                <KeyIcon class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />-->
<!--              </div>-->
<!--              <span class="font-medium">Secrets</span>-->
<!--            </div>-->
<!--            <div v-if="!props.row.taskDefinition.environmentVariables.secrets?.length"-->
<!--                 class="text-sm text-muted-foreground p-4 text-center bg-muted/10 rounded-lg">-->
<!--              No secrets available-->
<!--            </div>-->
<!--            <Table v-else>-->
<!--              <TableHeader>-->
<!--                <TableRow class="hover:bg-transparent">-->
<!--                  <TableHead class="w-1/3 text-primary">Name</TableHead>-->
<!--                  <TableHead class="w-2/3 text-primary">Value</TableHead>-->
<!--                </TableRow>-->
<!--              </TableHeader>-->
<!--              <TableBody>-->
<!--                <TableRow-->
<!--                  v-for="secret in props.row.taskDefinition.environmentVariables.secrets"-->
<!--                  :key="secret.name"-->
<!--                  class="hover:bg-muted/10">-->
<!--                  <TableCell class="font-medium group">-->
<!--                    <div class="flex items-center gap-2">-->
<!--                      <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">-->
<!--                        <KeyIcon class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />-->
<!--                      </div>-->
<!--                      {{ secret.name }}-->
<!--                      <button-->
<!--                        @click="copyToClipboard(secret.name)"-->
<!--                        class="invisible group-hover:visible hover:text-primary transition-colors">-->
<!--                        <CopyIcon class="h-4 w-4" />-->
<!--                      </button>-->
<!--                    </div>-->
<!--                  </TableCell>-->
<!--                  <TableCell class="group">-->
<!--                    <div class="flex items-center gap-2">-->
<!--                      <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ secret.value-->
<!--                        }}</span>-->
<!--                      <button-->
<!--                        @click="copyToClipboard(secret.value)"-->
<!--                        class="invisible group-hover:visible hover:text-primary transition-colors">-->
<!--                        <CopyIcon class="h-4 w-4" />-->
<!--                      </button>-->
<!--                    </div>-->
<!--                  </TableCell>-->
<!--                </TableRow>-->
<!--              </TableBody>-->
<!--            </Table>-->
<!--          </div>-->
<!--        </CardContent>-->
<!--      </div>-->
<!--    </div>-->
<!--  </Card>-->
<!--</template>-->

<!--<script setup lang="ts" generic="TData extends ServiceInterface">-->
<!--import type { ServiceInterface } from '@/components/AWS.Services/interfaces/service.interface.ts'-->
<!--import {-->
<!--  Copy as CopyIcon,-->
<!--  Globe as GlobeIcon,-->
<!--  Key as KeyIcon,-->
<!--  Settings as SettingsIcon,-->
<!--} from 'lucide-vue-next'-->
<!--import {-->
<!--  Table,-->
<!--  TableBody,-->
<!--  TableCell,-->
<!--  TableHead,-->
<!--  TableHeader,-->
<!--  TableRow,-->
<!--} from '@/components/ui/table'-->
<!--import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'-->
<!--import { useToast } from '@/components/ui/toast'-->

<!--const { toast } = useToast()-->
<!--const props = defineProps<{-->
<!--  row: TData-->
<!--  isDrawerOpen?: boolean-->
<!--}>()-->

<!--const copyToClipboard = async (text: string) => {-->
<!--  try {-->
<!--    await navigator.clipboard.writeText(text)-->
<!--    toast({-->
<!--      variant: 'success',-->
<!--      title: 'Copied to clipboard',-->
<!--      duration: 2000,-->
<!--    })-->
<!--  } catch (err) {-->
<!--    toast({-->
<!--      variant: 'destructive',-->
<!--      title: 'Failed to copy',-->
<!--      duration: 2000,-->
<!--    })-->
<!--  }-->
<!--}-->
<!--</script>-->
