import { defineStore } from "pinia";
import { reactive, computed, toRefs } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // 定义状态
  const state = reactive({
    isAuthenticated: !!localStorage.getItem("token"),
  });

  // 检查认证状态的方法
  const checkAuth = () => {
    state.isAuthenticated = !!localStorage.getItem("token");
    return state.isAuthenticated;
  };

  // 初始化认证状态
  const initializeAuth = () => {
    checkAuth();
  };

  // 清除认证状态
  const clearAuthState = () => {
    state.isAuthenticated = false;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // 定义 getters
  const isUserLoggedIn = computed(() => state.isAuthenticated);

  // 返回需要暴露的内容
  return {
    ...toRefs(state),
    initializeAuth,
    clearAuthState,
    isUserLoggedIn,
    checkAuth,
  };
});
