import axiosInstance from "@/utils/axios";

// 循环账单记录接口
interface RenewBillRecord {
  id: number;
  userId: number;
  name: string;
  details: string;
  categoryId: number;
  cycle: string;
  beginning: string;
  ending: string;
  renew: string;
  cost: number;
  isDeleted: string;
}

// 分页获取循环账单响应接口
interface RenewBillResponse {
  records: RenewBillRecord[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取循环账单请求体接口
interface GetRenewBillsRequest {
  currentPage: number;
  pageSize: number;
}

/**
 * 获取循环账单列表
 * @returns Promise<RenewBillResponse>
 */
export async function getRenewBills(): Promise<RenewBillResponse> {
  try {
    // 设置获取所有账单的请求参数
    const requestData: GetRenewBillsRequest = {
      currentPage: 1,
      pageSize: -1,
    };

    // 发送获取账单请求
    const response = await axiosInstance.post<RenewBillResponse>(
      "/renew-bill/page-query",
      requestData
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      // 从后端返回的错误信息中获取
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      // 请求已经发出，但是没有收到响应
      throw new Error("网络错误，请稍后重试");
    } else {
      // 其他错误
      throw new Error("获取失败，请稍后重试");
    }
  }
}
