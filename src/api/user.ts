import { useAuthStore } from "@/pinia/useAuthStore";
import axiosInstance from "@/utils/axios";

//用户登录返回的数据模板
interface LoginResponse {
  id: number;
  token: string;
  email: string;
  name: string;
  sex: string;
  avatar: string;
}
interface UserInfo {
  userId: number;
  email: string;
  name: string;
  sex: string;
  avatar: string;
}

//统一响应类R的数据类型
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
    (localStorage.getItem("token") ?? "") + authStore.isUserLoggedIn
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

// 发送验证码
export async function forgetPassword(
  email: string
): Promise<ApiResponse<string>> {
  try {
    //发送获取验证码请求
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/users/forget",
      {
        email,
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
      throw new Error("请求失败，请稍后重试");
    }
  }
}

// 验证验证码
export async function verifyAndLogin(
  code: string,
  email: string
): Promise<LoginResponse> {
  try {
    //发送获取验证码请求
    const response = await axiosInstance.post<LoginResponse>(
      "/users/code-login",
      {
        code,
        email,
      }
    );
    const loginData = response.data;
    localStorage.setItem("token", loginData.token);
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
      throw new Error("请求失败，请稍后重试");
    }
  }
}

// 携带token直接获取用户信息
export async function getUserInfos(): Promise<UserInfo> {
  try {
    const userinfo = await axiosInstance.get<UserInfo>("/users/user-info");
    return userinfo.data;
  } catch (error: any) {
    if (error.response?.data) {
      //从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      //请求已经发出，但是没有收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      //其他错误
      throw new Error("请求失败，请稍后重试");
    }
  }
}
