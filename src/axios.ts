import axios from "axios";

// 初始化axios实例，设定基础API_URL
// 之后发送请求通过这个配置请求头等通用配置
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 1500,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
