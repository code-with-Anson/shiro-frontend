import { useAuthStore } from "@/pinia/useAuthStore";
import type { NavigationGuard } from "vue-router";

export const authGuard: NavigationGuard = (to, from, next) => {
  const authStore = useAuthStore();
  const allowedPaths = ["/login", "/register", "/lost"];

  // 如果已登录但尝试访问登录/注册/找回密码页面，则重定向到账单管理页
  if (authStore.isAuthenticated && allowedPaths.includes(to.path)) {
    next("/bill-management");
    return;
  }

  // 如果未登录且尝试访问需要认证的页面，则重定向到登录页
  if (!authStore.checkAuth() && !allowedPaths.includes(to.path)) {
    next("/login");
    return;
  }

  // 其他情况正常导航
  next();
};
