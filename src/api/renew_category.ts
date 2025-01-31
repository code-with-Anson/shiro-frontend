import axiosInstance from "@/utils/axios";

// 分页获取循环账单分类接口
interface RenewCategoryResponse {
  records: Array<{
    id: number;
    name: string;
  }>;
  total: number;
  size: number;
  current: number;
  pages: number;
}

//统一响应类R数据结构接口
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 删除循环分类请求体
interface deleteCategoryRequest {
  renewCategoryIds: number[];
}
// 获取用户循环账单分类
export async function getAllRenewCategories(): Promise<RenewCategoryResponse> {
  try {
    //1.这样设置可以获取所有的循环账单分类
    let currentPage = 1;
    let pageSize = -1;
    //2.发送获取分类请求
    const response = await axiosInstance.post<RenewCategoryResponse>(
      "/renew-category/query",
      {
        currentPage,
        pageSize,
      }
    );

    const RenewCategories = response.data.records;
    localStorage.setItem("RenewCategories", JSON.stringify(RenewCategories));
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

// 删除循环分类
export async function deleteRenewCategory(toDelete: number[]): Promise<void> {
  try {
    const requestData: deleteCategoryRequest = {
      renewCategoryIds: toDelete,
    };
    const response = await axiosInstance.post<ApiResponse<null>>(
      "/renew-category/delete",
      requestData
    );
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "删除失败，请稍后重试");
    }
  }
}

export async function updateRenewCategory(
  id: string,
  newName: string
): Promise<void> {
  try {
    const response = await axiosInstance.post<ApiResponse<null>>(
      "/renew-category/update",
      {
        id,
        name: newName,
      }
    );
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "更新失败，请稍后重试");
    }
  }
}
