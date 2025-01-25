import axiosInstance from "@/utils/axios";

//统一响应类R的数据类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface CategoryResponse {
  records: Array<{
    id: number;
    name: string;
    categoryType: string;
  }>;
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取用户常规账单分类
export async function getAllCategories(): Promise<CategoryResponse> {
  try {
    //1.这样设置可以获取所有的账单分类
    let currentPage = 1;
    let pageSize = -1;
    //2.发送获取分类请求
    const response = await axiosInstance.post<CategoryResponse>(
      "/category/query",
      {
        currentPage,
        pageSize,
      }
    );

    const categories = response.data.records;
    localStorage.setItem("categories", JSON.stringify(categories));
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      //从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      //请求已经发出，但是没有收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      //其他错误
      throw new Error("获取失败，请稍后重试");
    }
  }
}
