<template>
  <div class="container mx-auto py-1">
    <div class="flex flex-col space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Platform Login</h1>
        <p class="text-lg text-muted-foreground">Select your authentication method to get
          started</p>
      </div>

      <Tabs default-value="credentials" class="w-full">
        <TabsList class="grid w-[400px] grid-cols-2">
          <TabsTrigger value="credentials">Username/Password</TabsTrigger>
          <TabsTrigger value="saml">SAML</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" class="space-y-6">
          <div class="flex flex-col space-y-4 max-w-[600px]">
            <div class="grid gap-6">
              <div class="space-y-2">
                <Label for="username">Username</Label>
                <Input id="username" v-model="username" placeholder="Enter your username" />
              </div>
              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input id="password" type="password" v-model="password"
                       placeholder="Enter your password" />
              </div>
            </div>
            <Button size="lg" type="submit" @click="handleCredentialsLogin"> Login with
              Credentials
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="saml" class="space-y-6">
          <div class="flex flex-col space-y-6 max-w-[600px]">
            <div class="grid gap-4">
              <div class="space-y-2">
                <Label>Email Access Control</Label>
                <Select v-model="emailAccess">
                  <SelectTrigger class="w-[300px]">
                    <SelectValue placeholder="Select email access type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Allow All Emails</SelectItem>
                    <SelectItem value="specific">Specific Email List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="emailAccess === 'specific'" class="space-y-2">
                <Label for="emails">Allowed Email Domains</Label>
                <Textarea
                  id="emails"
                  v-model="allowedEmails"
                  placeholder="Enter email domains (one per line)
example.com
company.org"
                  class="min-h-[150px]"
                />
              </div>
            </div>

            <div class="flex flex-col space-y-4">
              <Button size="lg" variant="default" @click="redirectToSamlSetup"> Configure SAML
                Settings
              </Button>
              <p class="text-sm text-muted-foreground">
                Configure your SAML settings to enable single sign-on for your organization
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const router = useRouter()
const username = ref('')
const password = ref('')
const emailAccess = ref('all')
const allowedEmails = ref('')

const handleCredentialsLogin = () => {
  // Implement credentials login logic here
}

const redirectToSamlSetup = () => {
  router.push('/settings/saml-setup')
}
</script>
