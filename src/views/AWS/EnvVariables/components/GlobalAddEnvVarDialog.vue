<template>
  <Dialog v-model:open="isOpen" :modal="true">
    <DialogTrigger v-if="showTrigger" as-child>
      <Button variant="outline" size="sm" class="gap-2 hover:shadow-sm">
        <PlusIcon class="h-4 w-4" />
        Add Variable
      </Button>
    </DialogTrigger>

    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold">Add Environment Variable</DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">Select target and provide name/value</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="grid grid-cols-1 gap-3">
          <Label class="text-xs">Cluster</Label>
          <Select v-model="form.cluster">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="c in clusters" :key="c" :value="c">{{ c }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <Label class="text-xs">Service</Label>
          <Select v-model="form.service" :disabled="!form.cluster">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="s in servicesByCluster[form.cluster!] || []" :key="s.name" :value="s.name">{{ s.name }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <Label class="text-xs">Container</Label>
          <Select v-model="form.container" :disabled="!form.service">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select container" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem v-for="c in containersByService[`${form.cluster}__${form.service}`] || []" :key="c" :value="c">{{ c }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <Label class="text-xs">Name</Label>
          <Input v-model="form.name" placeholder="VARIABLE_NAME" class="font-mono" />
        </div>

        <div class="grid grid-cols-1 gap-2">
          <Label class="text-xs">Value</Label>
          <Textarea v-model="form.value" rows="3" class="font-mono text-sm resize-none" placeholder="Enter value..." />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close" :disabled="loading">Cancel</Button>
        <Button @click="submit" :disabled="loading">
          <Loader2Icon v-if="loading" class="h-4 w-4 animate-spin mr-2" />
          Add Variable
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2Icon, PlusIcon } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from '@/components/ui/toast'
import { AwsService } from '@/services/aws.service'
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import { addEnvironmentVariablesSchema, type AddEnvironmentVariablesInput } from '@/views/AWS/Services/components/environment-variable.schema'

const props = withDefaults(defineProps<{ open?: boolean; showTrigger?: boolean; initialCluster?: string | null; initialService?: string | null; initialContainer?: string | null }>(), { showTrigger: false })
const emit = defineEmits<{ (e: 'update:open', v: boolean): void; (e: 'added'): void }>()

const isOpen = computed({ get: () => props.open ?? false, set: (v) => emit('update:open', v) })
const loading = ref(false)
const aws = new AwsService()
const { toast } = useToast()

const { services } = storeToRefs(useDataStore())

const clusters = computed(() => Array.from(new Set(services.value.map((s) => s.clusterName))).sort())

const servicesByCluster = computed<Record<string, ServiceInterface[]>>(() => {
  const map: Record<string, ServiceInterface[]> = {}
  services.value.forEach((s) => {
    ;(map[s.clusterName] ||= []).push(s)
  })
  Object.keys(map).forEach((k) => (map[k] = map[k].slice().sort((a, b) => a.name.localeCompare(b.name))))
  return map
})
watch(
  () => props.open,
  (v) => {
    if (v) {
      form.cluster = props.initialCluster ?? null
      form.service = props.initialService ?? null
      form.container = props.initialContainer ?? null
    }
  },
)


const containersByService = computed<Record<string, string[]>>(() => {
  const map: Record<string, string[]> = {}
  services.value.forEach((s) => {
    map[`${s.clusterName}__${s.name}`] = s.containers.map((c) => c.name).sort()
  })
  return map
})

const form = reactive<{ cluster: string | null; service: string | null; container: string | null; name: string; value: string }>(
  { cluster: null, service: null, container: null, name: '', value: '' },
)

watch(
  () => form.cluster,
  () => {
    form.service = null
    form.container = null
  },
)
watch(
  () => form.service,
  () => {
    form.container = null
  },
)

const close = () => {
  isOpen.value = false
}

const submit = async () => {
  if (!form.cluster || !form.service || !form.container) {
    toast({ variant: 'destructive', title: 'Missing target', description: 'Please select cluster, service and container' })
    return
  }
  const payload: AddEnvironmentVariablesInput = {
    clusterName: form.cluster,
    serviceName: form.service,
    containerName: form.container,
    environmentVariables: [{ name: form.name.trim(), value: form.value }],
  }
  const parsed = addEnvironmentVariablesSchema.safeParse(payload)
  if (!parsed.success) {
    toast({ variant: 'destructive', title: 'Validation error', description: 'Please fill in all fields correctly' })
    return
  }

  try {
    loading.value = true
    await aws.addEnvironmentVariables(payload)
    toast({ variant: 'success', title: 'Environment variable added', description: `${form.name} saved.` })
    emit('added')
    isOpen.value = false
    form.name = ''
    form.value = ''
  } catch (e: any) {
    toast({ variant: 'destructive', title: 'Failed to add variable', description: e?.message || 'Unexpected error' })
  } finally {
    loading.value = false
  }
}
</script>

