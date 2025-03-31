import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import './assets/main.css';
import router from '@/router';
import { createPinia } from 'pinia';
import { piniaPersistedState } from '@/plugins/persistedstate.ts';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersistedState);

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin);
app.mount('#app');
