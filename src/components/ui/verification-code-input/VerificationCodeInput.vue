<script setup lang="ts">
import { Input } from '@/components/ui/input'
import {
  handleVerificationCodeInput,
  handleVerificationCodeKeyDown,
} from '@/utils/twoFactorUtils.ts'

const props = defineProps({
  code: {
    type: Array as () => string[],
    required: true,
  },
  prefix: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:code'])

const updateCode = (index: number, value: string) => {
  const newCode = [...props.code]
  newCode[index] = value
  emit('update:code', newCode)
}

const handleInput = (index: number, event: Event) => {
  handleVerificationCodeInput(index, event, props.code, props.prefix)
  emit('update:code', [...props.code])
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  handleVerificationCodeKeyDown(index, event, props.code, props.prefix)
  emit('update:code', [...props.code])
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex justify-center space-x-2">
      <template v-for="(digit, index) in code" :key="index">
        <Input
          :id="`${prefix}-${index}`"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          class="w-10 h-12 text-center text-lg"
          :model-value="code[index]"
          @update:model-value="updateCode(index, $event.toString())"
          :disabled="disabled"
          @input="handleInput(index, $event)"
          @keydown="handleKeyDown(index, $event)"
        />
      </template>
    </div>
  </div>
</template>
