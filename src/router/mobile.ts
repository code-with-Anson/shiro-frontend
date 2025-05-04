import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "@/utils/authGuard";
import m_bill from "../views/mobile/m_bill.vue";
import mBillStatistics from "@/views/mobile/m_bill_statistics.vue";
import M_ai_chat from "@/views/mobile/m_ai_chat.vue";

// 这里是移动端路由，当检测到用户为移动端就会应用这个路由
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
const mobileRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 将根路径指向账单管理页面而非统计页
      path: "/",
      redirect: "/bill-management",
    },
    {
      path: "/bill-management",
      name: "m_bill",
      component: m_bill,
      meta: {
        requiresAuth: true,
        title: "账单管理",
      },
    },
    {
      path: "/statistics",
      name: "mBillStatistics",
      component: mBillStatistics,
      meta: {
        requiresAuth: true,
        title: "账单统计",
      },
    },
    {
      path: "/ai-chat-mobile",
      name: "ai-chat-mobile",
      component: M_ai_chat,
      meta: {
        requiresAuth: true,
        title: "ai聊天助手",
      },
    },
    {
      path: "/renew-bill",
      name: "m_renew_bill",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("@/views/mobile/m_renew_bill.vue"),
    },
    {
      path: "/me",
      name: "m_me",
      component: () => import("@/views/mobile/m_me.vue"),
    },
    {
      path: "/login",
      name: "m_login",
      component: () => import("@/views/mobile/m_login.vue"),
    },
    {
      path: "/register",
      name: "m_register",
      component: () => import("@/views/mobile/m_register.vue"),
    },
    {
      path: "/lost",
      name: "m_lost",
      component: () => import("@/views/mobile/m_lost.vue"),
    },
    {
      path: "/bill-detail",
      name: "m_bill_detail",
      component: () => import("@/views/mobile/m_bill_detail.vue"),
    },
    {
      path: "/bill-add",
      name: "m_bill_add",
      component: () => import("@/views/mobile/m_bill_add.vue"),
    },
    {
      path: "/edit-renew-category",
      name: "m_renew_category_edit",
      component: () => import("@/views/mobile/m_renew_category_edit.vue"),
    },
    {
      path: "/add-renew-bill",
      name: "m_renew_bill_add",
      component: () => import("@/views/mobile/m_renew_bill_add.vue"),
    },
    {
      path: "/edit-renew-bill",
      name: "m_renew_bill_edit",
      component: () => import("@/views/mobile/m_renew_bill_edit.vue"),
    },
  ],
});

mobileRouter.beforeEach(authGuard);

export default mobileRouter;
