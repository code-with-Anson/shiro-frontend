import { defineStore } from "pinia";
import { reactive, computed, toRefs } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // 定义状态
  const state = reactive({
    isAuthenticated: !!localStorage.getItem("token"),
  });

  const initializeAuth = () => {
    const token = localStorage.getItem("token");
    if (token) {
      state.isAuthenticated = true;
    }
  };

  // 设置认证状态
  const setAuthState = (value: boolean) => {
    state.isAuthenticated = value;
  };

  // 清除认证状态
  const clearAuthState = () => {
    state.isAuthenticated = false;
  };

  // 定义 getters
  const isUserLoggedIn = computed(() => state.isAuthenticated);

  // 返回需要暴露的内容
  return {
    ...toRefs(state),
    initializeAuth,
    clearAuthState,
    isUserLoggedIn,
    setAuthState,
  };
});
