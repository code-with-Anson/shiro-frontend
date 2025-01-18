import type { NavigationGuard } from "vue-router";

// 解耦了检测登录状态的逻辑
// 当用户的 token 不存在时，会跳转到登录页面
// 当用户的 token 存在时，会继续访问下一个页面
// 这个逻辑可以应用在移动和网页端

export const authGuard: NavigationGuard = (to, from, next) => {
  const token = localStorage.getItem("token");
  const allowedPaths = ["/login", "/register", "/lost"];

  if (!token && !allowedPaths.includes(to.path)) {
    next("/login");
  } else {
    next();
  }
};
