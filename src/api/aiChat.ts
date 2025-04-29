import axiosInstance from "@/utils/axios";
import type { AxiosProgressEvent } from "axios";

/**
 * 发送聊天消息并获取流式响应
 * @param message 用户输入的消息
 * @param onChunk 处理每个数据块的回调函数
 */
export async function sendChatMessage(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  let accumulatedResponse = "";

  try {
    // 使用axios实例发起POST请求，并设置120秒超时
    const response = await axiosInstance.post(
      `/ai/flux-ChatClient/OpenAi-momoi`,
      message,
      {
        responseType: "text",
        // 设置超时时间为120秒
        timeout: 120000,
        // 使用onDownloadProgress处理流式响应
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          // 获取当前完整的响应文本
          const responseText = progressEvent.event?.target?.response || "";

          // 如果有新内容，则提取新内容
          if (
            responseText &&
            responseText.length > accumulatedResponse.length
          ) {
            const newChunk = responseText.substring(accumulatedResponse.length);
            accumulatedResponse = responseText;

            if (newChunk) {
              onChunk(newChunk);
            }
          }
        },
        // 确保不会缓存请求
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "text/plain",
          Accept: "text/html;charset=UTF-8",
        },
      }
    );

    // 确保最终完整响应被处理
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "请求失败");
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "请求失败，请稍后重试");
    }
  }
}

/**
 * 替代方案：使用fetch API处理流式响应
 * 如果上面的方法不能正常工作，可以考虑使用此方法
 */
export async function sendChatMessageFetch(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || axiosInstance.defaults.baseURL;
    const token = localStorage.getItem("token") || "";

    const controller = new AbortController();
    // 设置120秒超时
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${baseUrl}/ai/flux-ChatClient/OpenAi-momoi`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Accept: "text/html;charset=UTF-8",
        Authorization: token,
        "Cache-Control": "no-cache",
      },
      body: message, // 直接发送消息内容作为请求体
      signal: controller.signal,
    });

    // 清除超时
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应数据流");
    }

    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试");
    } else if (error.response?.data) {
      throw new Error(error.response.data.msg || "请求失败");
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "请求失败，请稍后重试");
    }
  }
}
