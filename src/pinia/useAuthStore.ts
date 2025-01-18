import { defineStore } from "pinia";
import { reactive, computed, toRefs } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // 定义状态
  const state = reactive({
    isAuthenticated: !!localStorage.getItem("token"),
    token: null as string | null,
  });

  // 定义 actions
  const login = (token: string) => {
    state.isAuthenticated = true;
    state.token = token;
    localStorage.setItem("token", token);
  };

  const logout = () => {
    state.isAuthenticated = false;
    state.token = null;
    localStorage.removeItem("token");
  };

  const initializeAuth = () => {
    const token = localStorage.getItem("token");
    if (token) {
      state.token = token;
      state.isAuthenticated = true;
    }
  };

  // 定义 getters
  const isUserLoggedIn = computed(() => state.isAuthenticated);

  // 返回需要暴露的内容
  return {
    ...toRefs(state),
    login,
    logout,
    initializeAuth,
    isUserLoggedIn,
  };
});
