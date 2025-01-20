import { useAuthStore } from "@/pinia/useAuthStore";
import axiosInstance from "@/utils/axios";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  id: number;
  token: string;
  email: string;
  name: string;
  sex: string;
  avatar: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    //发送登录请求
    const response = await axiosInstance.post<LoginResponse>("/users/login", {
      email,
      password,
    });

    const loginData = response.data;
    const authStore = useAuthStore();
    localStorage.setItem("token", loginData.token);
    localStorage.setItem("user", JSON.stringify(loginData));
    return loginData;
  } catch (error: any) {
    // 统一处理错误
    const errorMessage =
      error.response?.data?.message || "登录失败，请稍后重试";
    throw new Error(errorMessage);
  }
}

export function logout() {
  const authStore = useAuthStore();
  if (authStore.clearAuthState) {
    authStore.clearAuthState();
  }
  console.log(
    "清理后的token,user,pinia状态",
    (localStorage.getItem("token") ?? "") +
      (localStorage.getItem("user") ?? "") +
      authStore.isUserLoggedIn
  );
}
