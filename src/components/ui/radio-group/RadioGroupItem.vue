<script setup lang="ts">
import type { RadioGroupItemProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils'
import { CheckIcon } from '@radix-icons/vue'
import {
  RadioGroupIndicator,
  RadioGroupItem,

  useForwardProps,
} from 'radix-vue'
import { computed } from 'vue'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'peer aspect-square h-4 w-4 rounded-full border border-slate-200 border-slate-900 text-slate-900 shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:border-slate-50 dark:text-slate-50 dark:focus-visible:ring-slate-300',
        props.class,
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <CheckIcon class="h-3.5 w-3.5 fill-primary" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
