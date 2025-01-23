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

// 获取用户常规账单分类
export async function getMonthBills(
  month: number,
  year: number
): Promise<BillsResponse> {
  try {
    //1.发送获取账单请求
    const response = await axiosInstance.post<BillsResponse>("/bills/month", {
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
