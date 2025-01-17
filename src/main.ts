import { createApp } from "vue";
import App from "./App.vue";
import { getRouterByDevice } from "./router/routerLoader";
import { createPinia } from "pinia";

// 初始化应用
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
const initApp = async () => {
  try {
    const app = createApp(App);
    app.use(createPinia());
    const router = await getRouterByDevice(); // 等待路由加载完成
    app.use(router);
    app.mount("#app"); // 确保挂载时路由已就绪
  } catch (error) {
    console.error("网页路由初始化失败", error);
  }
};

initApp();
