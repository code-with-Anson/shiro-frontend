import { useAuthStore } from "@/pinia/useAuthStore";
import axiosInstance from "@/utils/axios";

//定义返回的数据类型
interface LoginResponse {
  id: number;
  token: string;
  email: string;
  name: string;
  sex: string;
  avatar: string;
}

//定义返回的数据类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 用户登录
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
    localStorage.setItem("token", loginData.token);
    localStorage.setItem("user", JSON.stringify(loginData));
    return loginData;
  } catch (error: any) {
    if (error.response?.data) {
      //从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      //请求已经发出，但是没有收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      //其他错误
      throw new Error("登录失败，请稍后重试");
    }
  }
}

// 退出用户
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

// 注册用户
export async function register(
  name: string,
  email: string,
  password: string
): Promise<ApiResponse<string>> {
  try {
    //发送注册请求
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/users/register",
      {
        name,
        email,
        password,
      }
    );

    const loginData = response.data;
    return loginData;
  } catch (error: any) {
    if (error.response?.data) {
      //从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      //请求已经发出，但是没有收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      //其他错误
      throw new Error("注册失败，请稍后重试");
    }
  }
}
