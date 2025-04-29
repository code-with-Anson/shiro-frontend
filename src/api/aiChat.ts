import axiosInstance from "@/utils/axios";
import { ElMessage } from "element-plus";

/**
 * 发送聊天消息并获取流式响应
 * @param message 用户输入的消息
 * @param onChunk 处理每个数据块的回调函数
 */
export async function sendChatMessage(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    // 发起流式请求
    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3952"
      }/ai/flux-ChatClient/OpenAi-momoi?message=${encodeURIComponent(message)}`,
      {
        method: "GET",
        headers: {
          Accept: "text/html;charset=UTF-8",
          Authorization: localStorage.getItem("token") || "",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "请求失败，请稍后重试");
    }
  }
}
