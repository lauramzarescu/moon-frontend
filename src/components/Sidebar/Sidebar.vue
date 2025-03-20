<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { cn } from '@//utils'
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import { sidebarConfig, SidebarSection } from '@/router/sidebar.ts'

const router = useRouter()
const route = useRoute()
const activeButton = ref('')

const navigate = (route: string) => {
  activeButton.value = route
  router.push(route)
}

onMounted(async () => {
  await router.isReady()
  activeButton.value = route.path
})

watch(
  () => route.path,
  (newPath) => {
    activeButton.value = newPath
  },
)
</script>

<template>
  <div
    :class="cn('pb-12 border-r border-border/40 dark:border-border/20 flex flex-col h-full', $attrs.class ?? '')">
    <div class="flex-1">
      <div class="space-y-4 py-4">
        <div class="px-3 py-2">
          <h2 class="px-4 text-lg font-semibold tracking-tight text-primary/80 uppercase">AWS</h2>
          <div class="space-y-1 py-2">
            <Button
              v-for="item in sidebarConfig.filter((i) => i.section === SidebarSection.AWS)"
              :key="item.path"
              :disabled="!item.active"
              :variant="activeButton === item.path ? 'secondary' : 'ghost'"
              class="w-full justify-start"
              @click="navigate(item.path)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mr-2 h-4 w-4"
                v-html="item.icon"
              />
              {{ item.name }}
            </Button>
          </div>
        </div>

        <!--                <div class="px-3 py-2">-->
        <!--                    <h2 class="px-4 text-lg font-semibold tracking-tight text-primary/80 uppercase">Digital Ocean</h2>-->
        <!--                    <div class="space-y-1 py-2">-->
        <!--                        <Button-->
        <!--                            v-for="item in sidebarConfig.filter((i) => i.section === SidebarSection.DigitalOcean)"-->
        <!--                            :key="item.path"-->
        <!--                            :disabled="!item.active"-->
        <!--                            :variant="activeButton === item.path ? 'secondary' : 'ghost'"-->
        <!--                            class="w-full justify-start"-->
        <!--                            @click="navigate(item.path)"-->
        <!--                        >-->
        <!--                            <svg-->
        <!--                                xmlns="http://www.w3.org/2000/svg"-->
        <!--                                viewBox="0 0 24 24"-->
        <!--                                fill="none"-->
        <!--                                stroke="currentColor"-->
        <!--                                stroke-width="1.5"-->
        <!--                                stroke-linecap="round"-->
        <!--                                stroke-linejoin="round"-->
        <!--                                class="mr-2 h-4 w-4"-->
        <!--                                v-html="item.icon"-->
        <!--                            />-->
        <!--                            {{ item.name }}-->
        <!--                        </Button>-->
        <!--                    </div>-->
        <!--                </div>-->
      </div>
    </div>

    <!-- Settings section at bottom -->
    <div class="px-3 py-2 mt-auto">
      <div class="space-y-1">
        <Button
          v-for="item in sidebarConfig.filter((i) => i.section === SidebarSection.Settings)"
          :key="item.path"
          :disabled="!item.active"
          :variant="activeButton === item.path ? 'secondary' : 'ghost'"
          class="w-full justify-start"
          @click="navigate(item.path)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2 h-4 w-4"
            v-html="item.icon"
          />
          {{ item.name }}
        </Button>
      </div>
    </div>
  </div>
</template>
