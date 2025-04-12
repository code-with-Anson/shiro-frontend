import axiosInstance from "@/utils/axios";
import { ElMessage } from "element-plus";

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

// 更新循环账单自动续费状态接口
export async function updateAutoRenewStatus(
  id: number,
  renew: string,
  showMessage: boolean = true
): Promise<void> {
  try {
    const response = await axiosInstance.post("/renew-bill/update", {
      id,
      renew,
    });

    if (response.data.code !== "20039") {
      throw new Error(response.data.msg || "更新失败");
    }

    // 根据参数决定是否显示成功消息
    if (showMessage) {
      ElMessage({
        message: "更新续费状态成功",
        type: "success",
        plain: true,
      });
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("更新失败，请稍后重试");
    }
  }
}

// 更新循环账单
export async function updateRenewBill(
  data: {
    id: number;
    name: string;
    cost: number;
    categoryId: number;
    cycle: string;
    beginning: string;
    ending: string;
    details: string;
    renew: string;
    isDeleted?: string;
  },
  showMessage: boolean = true // 添加控制是否显示消息的参数
): Promise<void> {
  try {
    const response = await axiosInstance.post("/renew-bill/update", data);

    if (response.data.code !== "20039") {
      throw new Error(response.data.msg || "更新失败");
    }

    // 根据参数决定是否显示成功消息
    if (showMessage) {
      ElMessage({
        message: "更新成功",
        type: "success",
        plain: true, // 移动端常用的plain风格
      });
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("更新失败，请稍后重试");
    }
  }
}

// 删除循环账单
export async function deleteRenewBill(
  renewBillIds: number[],
  showMessage: boolean = true
): Promise<void> {
  try {
    const response = await axiosInstance.post("/renew-bill/real-delete", {
      renewBill_ids: renewBillIds,
    });

    if (response.data.code !== "20039") {
      throw new Error(response.data.msg || "删除失败");
    }

    // 根据参数决定是否显示成功消息
    if (showMessage) {
      ElMessage({
        message: "删除成功",
        type: "success",
        plain: true,
      });
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("删除失败，请稍后重试");
    }
  }
}

// 添加循环账单
export async function addRenewBill(
  data: {
    name: string;
    cost: number;
    categoryId: number;
    cycle: string;
    beginning: string;
    ending: string;
    details: string;
    renew: string;
  },
  showMessage: boolean = true
): Promise<void> {
  try {
    const response = await axiosInstance.post("/renew-bill/add", data);

    if (response.data.code !== "20039") {
      throw new Error(response.data.msg || "添加失败");
    }

    // 根据参数决定是否显示成功消息
    if (showMessage) {
      ElMessage({
        message: "添加成功",
        type: "success",
        plain: true,
      });
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("添加失败，请稍后重试");
    }
  }
}
