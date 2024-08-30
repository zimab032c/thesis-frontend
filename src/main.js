import { createApp } from 'vue';
import App from './App.vue';
import NProgressPlugin from './nprogress';
import router from './router'; // Import the router you created

const app = createApp(App);

app.use(NProgressPlugin);
app.use(router); // Tell the app to use the router

app.mount('#app');
