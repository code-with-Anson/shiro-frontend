import axios from "axios";

// 初始化axios实例，设定基础API_URL
// 之后发送请求通过这个配置请求头等通用配置
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT,
  timeout: 5000,
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
// 这里着重说一下，后端雪花算法生成的id在前端必须转换字符串或者使用Bigint
// 不然会出现精度丢失的问题
// 也就是说，无法准确更新对应的账单了
axiosInstance.interceptors.response.use(
  (response) => {
    const handleData = (data: any): any => {
      if (!data) return data;

      if (Array.isArray(data)) {
        return data.map(handleData);
      }

      if (typeof data === "object") {
        const newData: Record<string, any> = { ...data };
        for (const key in newData) {
          // 针对大数字 ID 进行特殊处理
          if (
            (key === "id" || key === "categoryId") &&
            typeof newData[key] === "number"
          ) {
            newData[key] = String(BigInt(newData[key]));
          }
          // 其他非 amount 字段转字符串
          else if (key !== "amount" && typeof newData[key] !== "object") {
            newData[key] = String(newData[key]);
          } else if (typeof newData[key] === "object") {
            newData[key] = handleData(newData[key]);
          }
        }
        return newData;
      }

      return data;
    };

    response.data = handleData(response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
        case 50393:
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
