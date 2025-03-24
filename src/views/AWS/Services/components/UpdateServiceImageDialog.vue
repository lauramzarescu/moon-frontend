<template>
  <Button
    variant="outline"
    size="sm"
    class="h-7 px-2 gap-1"
    @click="isDialogOpen = true; emit('dialog-open')"
  >
    <RefreshCwIcon class="h-3.5 w-3.5" />
    <span class="text-xs">Update Image</span>
  </Button>

  <Dialog v-model:open="isDialogOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isConfirming ? 'Confirm Image Update' : 'Update Container Image' }}
        </DialogTitle>
        <DialogDescription>
          {{
            isConfirming
              ? `Are you sure you want to update the image from "${currentImage}" to "${newImageUri}"?`
              : 'Specify the new image URI for this container.'
          }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="!isConfirming" class="mx-auto w-full">
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="current-image">Current Image</Label>
            <Input id="current-image" :model-value="currentImage" disabled class="bg-muted" />
          </div>
          <div class="space-y-2">
            <Label for="new-image" class="flex items-center justify-between">
              New Image URI
              <span v-if="validationError" class="text-xs text-destructive">{{ validationError
                }}</span>
            </Label>
            <Input
              id="new-image"
              :default-value="currentImage"
              v-model="newImageUri"
              placeholder="Enter new image URI"
              :class="{'border-destructive': validationError}"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          {{ isConfirming ? 'Back' : 'Cancel' }}
        </Button>
        <Button
          type="submit"
          @click="isConfirming ? handleSubmit() : showConfirmation()"
          :disabled="isLoading || (!isConfirming && (!newImageUri || !!validationError))"
        >
          <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          {{ buttonText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2Icon, RefreshCwIcon } from 'lucide-vue-next'
import { AwsService } from '@/services/aws.service.ts'
import { serviceUpdateImageSchema } from '../components/schema.ts'

const props = defineProps<{
  currentImage: string
  containerName: string
  clusterName: string
  serviceName: string
}>()

const emit = defineEmits<{
  (e: 'image-updated'): void
  (e: 'dialog-close'): void
  (e: 'dialog-open'): void
}>()

const isDialogOpen = ref(false)
const isConfirming = ref(false)
const newImageUri = ref('')
const isLoading = ref(false)
const validationError = ref('')
const awsService = new AwsService()

// Validate input when newImageUri changes
watch(newImageUri, (value) => {
  try {
    const result = serviceUpdateImageSchema.parse({
      clusterName: props.clusterName,
      serviceName: props.serviceName,
      containerName: props.containerName,
      newImageUri: value,
    })
    validationError.value = ''
  } catch (error: any) {
    if (error.errors && error.errors.length > 0) {
      validationError.value = error.errors[0].message
    } else {
      validationError.value = 'Invalid input'
    }
  }
})

const buttonText = computed(() => {
  if (isLoading.value) return 'Updating...'
  if (isConfirming.value) return 'Confirm Update'
  return 'Update Image'
})

const showConfirmation = () => {
  isConfirming.value = true
}

const cancelConfirmation = () => {
  isConfirming.value = false
}

const handleClose = () => {
  if (isConfirming.value) {
    cancelConfirmation()
  } else {
    isDialogOpen.value = false
    newImageUri.value = props.currentImage
    emit('dialog-close')
  }
}

const handleSubmit = async () => {
  try {
    isLoading.value = true

    await awsService.updateServiceImage({
      clusterName: props.clusterName,
      serviceName: props.serviceName,
      containerName: props.containerName,
      newImageUri: newImageUri.value,
    })

    emit('image-updated')
    isDialogOpen.value = false
    isConfirming.value = false
    emit('dialog-close')
  } catch (error) {
    console.error('Failed to update image:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  newImageUri.value = props.currentImage
})
</script>
