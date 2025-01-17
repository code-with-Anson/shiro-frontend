import { createRouter, createWebHistory } from "vue-router";
import bill from "../views/desktop/bill.vue";

// 这里是桌面端路由，当检测到用户为桌面端就会应用这个路由
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
const desktopRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "bill",
      component: bill,
    },
    {
      path: "/renew_bill",
      name: "renew_bill",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/desktop/renew_bill.vue"),
    },
    {
      path: "/me",
      name: "me",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/desktop/me.vue"),
    },
  ],
});

export default desktopRouter;
