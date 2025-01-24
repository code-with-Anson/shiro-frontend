import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "@/utils/authGuard";
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
      component: () => import("@/views/desktop/renew_bill.vue"),
    },
    {
      path: "/me",
      name: "me",
      component: () => import("@/views/desktop/me.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/desktop/login.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/desktop/register.vue"),
    },
    {
      path: "/lost",
      name: "lost",
      component: () => import("@/views/desktop/lost.vue"),
    },
  ],
});

desktopRouter.beforeEach(authGuard);

export default desktopRouter;
