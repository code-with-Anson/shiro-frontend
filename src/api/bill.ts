import axiosInstance from "@/utils/axios";

//统一响应类R的数据类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

//获取常规账单返回的数据模板
interface BillsResponse {
  id: number;
  amount: number;
  type: string;
  categoryId: number;
  detail: string;
  date: Date;
}

// 账单请求体
interface BillUpdateRequest {
  id: number;
  amount?: number;
  categoryId?: number;
  date?: string;
  detail?: string;
  type?: string;
}

// 按照月份获取用户常规账单
export async function getMonthBills(
  month: number,
  year: number
): Promise<BillsResponse[]> {
  try {
    //1.发送获取账单请求
    const response = await axiosInstance.post<BillsResponse[]>("/bills/month", {
      month,
      year,
    });
    //2.接收并保存数据
    const bills = response.data;
    localStorage.setItem("bills", JSON.stringify(bills));
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

// 更新账单
export async function updateBill(updateData: BillUpdateRequest): Promise<void> {
  try {
    // 发送更新账单请求
    const response = await axiosInstance.post<ApiResponse<null>>(
      "/bills/update",
      updateData
    );
  } catch (error: any) {
    // 错误处理逻辑
    if (error.response?.data) {
      // 从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      // 请求已发出但未收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      // 其他错误
      throw new Error(error.message || "更新失败，请稍后重试");
    }
  }
}
