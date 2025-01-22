import axios from "axios";

// 初始化axios实例，设定基础API_URL
// 之后发送请求通过这个配置请求头等通用配置
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT,
  timeout: 1500,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：添加token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理常见错误
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token过期或无效，清除本地存储并重定向到登录页
          localStorage.removeItem("token");
          window.location.href = "/login";
          break;
        case 403:
          console.error("没有权限访问该资源");
          break;
        case 404:
          console.error("请求的资源不存在");
          break;
        case 500:
          console.error("服务器错误");
          break;
        default:
          console.error("发生错误:", error.response.status);
      }
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;
