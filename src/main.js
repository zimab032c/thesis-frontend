import { createApp } from "vue";
import App from "./App.vue";
import NProgressPlugin from "./nprogress";
import router from "./router";

import "./assets/custom-fonts.css";

const app = createApp(App);

app.use(NProgressPlugin);
app.use(router);

app.mount("#app");
