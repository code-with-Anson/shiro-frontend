import { createRouter, createWebHistory } from "vue-router";
import m_bill from "../views/mobile/m_bill.vue";
import { authGuard } from "@/logic/authGuard";

// 这里是移动端路由，当检测到用户为桌面端就会应用这个路由
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
const mobileRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "m_bill",
      component: m_bill,
    },
    {
      path: "/renew_bill",
      name: "m_renew_bill",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/mobile/m_renew_bill.vue"),
    },
    {
      path: "/me",
      name: "m_me",
      component: () => import("../views/mobile/m_me.vue"),
    },
    {
      path: "/login",
      name: "m_login",
      component: () => import("../views/mobile/m_login.vue"),
    },
    {
      path: "/register",
      name: "m_register",
      component: () => import("../views/mobile/m_register.vue"),
    },
    {
      path: "/lost",
      name: "m_lost",
      component: () => import("../views/mobile/m_lost.vue"),
    },
  ],
});

mobileRouter.beforeEach(authGuard);

export default mobileRouter;
