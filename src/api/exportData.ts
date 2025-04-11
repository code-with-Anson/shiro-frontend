import axiosInstance from "../utils/axios";
import { ElMessage } from "element-plus";

// 导出月度账单数据到邮箱
export async function exportMonthlyBillsToEmail(
  year: number,
  month?: number,
  onLoadingChange?: (loading: boolean) => void // 添加加载状态回调
) {
  try {
    // 开始加载
    onLoadingChange?.(true);

    // 构造请求参数
    const params: { year: number; month?: number } = { year };
    if (month !== undefined) {
      params.month = month;
    }

    // 发送GET请求到正确的API路径
    const response = await axiosInstance.get(
      "/api/export/bills/monthly/email",
      { params }
    );

    console.log("导出响应:", response.data); // 调试用

    // 修改为字符串比较，与项目中其他API保持一致
    if (response.data && response.data.code === "20039") {
      // 成功情况下，直接显示后端返回的消息
      ElMessage({
        message: response.data.data || "导出成功",
        type: "success",
        plain: true,
      });
      return response.data;
    } else {
      // 服务端返回了错误信息的情况
      ElMessage({
        message: response.data.msg || "导出失败",
        type: "error",
        plain: true,
      });
      throw new Error(response.data?.msg || "导出失败");
    }
  } catch (error: any) {
    // 这里不再显示错误消息，避免重复
    // 只捕获并向上传递错误
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "导出失败，请稍后重试");
    }
  } finally {
    // 结束加载，无论成功还是失败
    onLoadingChange?.(false);
  }
}
