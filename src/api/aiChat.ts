import axiosInstance from "@/utils/axios";
import type { AxiosProgressEvent } from "axios";
import { v4 as uuidv4 } from "uuid"; // 需要安装: npm install uuid @types/uuid

// 会话接口类型定义
export interface UserConversation {
  userId: number;
  conversationId: string;
  topic: string;
  createTime: string;
  updateTime: string;
}

export interface PageResponse {
  records: UserConversation[];
  total: number;
  size: number;
  current: number;
}

// 聊天消息接口定义
export interface ChatMessage {
  type: "user" | "ai";
  content: string;
  time: string;
}

// 判断响应是否成功的辅助函数
// 兼容数字类型和字符串类型的status code
const isSuccessResponse = (code: any): boolean => {
  // 成功的返回码可能是0或"20039"
  return code === 0 || code === "0" || code === "20039";
};

/**
 * 发送聊天消息并获取流式响应
 * @param message 用户输入的消息
 * @param conversationId 会话ID
 * @param onChunk 处理每个数据块的回调函数
 */
export async function sendChatMessage(
  message: string,
  conversationId: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  let accumulatedResponse = "";

  try {
    // 使用axios实例发起POST请求，并设置120秒超时
    const response = await axiosInstance.post(
      `/ai/flux-ChatClient/OpenAi-momoi`,
      {
        message: message,
        conversationId: conversationId,
      },
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
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
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
 * 创建新会话
 * @param topic 会话主题，可选
 * @returns 返回会话ID
 */
export async function createConversation(
  topic: string = "新对话"
): Promise<string> {
  const conversationId = uuidv4(); // 生成UUID作为会话ID

  try {
    const response = await axiosInstance.post("/ai/user-conversation/create", {
      conversationId,
      topic,
    });

    if (isSuccessResponse(response.data.code)) {
      return conversationId;
    } else {
      throw new Error(response.data.msg || "创建会话失败");
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "创建会话失败");
    } else {
      throw new Error("网络错误，创建会话失败");
    }
  }
}

/**
 * 获取会话历史记录
 * @param currentPage 当前页码
 * @param pageSize 每页大小
 * @returns 会话记录分页数据
 */
export async function getConversationHistory(
  currentPage: number = 1,
  pageSize: number = 10
): Promise<PageResponse> {
  try {
    const response = await axiosInstance.post("/ai/user-conversation/history", {
      currentPage,
      pageSize,
    });

    // 使用封装的判断函数检查响应状态
    if (isSuccessResponse(response.data.code)) {
      // 增加防御性代码处理可能的数据异常
      const data = response.data.data || {};
      return {
        records: Array.isArray(data.records) ? data.records : [],
        total: typeof data.total === "number" ? data.total : 0,
        size: typeof data.size === "number" ? data.size : pageSize,
        current: typeof data.current === "number" ? data.current : currentPage,
      };
    } else {
      console.error("获取会话历史失败:", response.data);
      throw new Error(response.data.msg || "获取会话历史失败");
    }
  } catch (error: any) {
    console.error("获取会话历史异常:", error);
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "获取会话历史失败");
    } else {
      throw new Error("网络错误，获取会话历史失败");
    }
  }
}

/**
 * 获取特定对话的历史消息
 * @param conversationId 会话ID
 * @returns 返回该会话的历史消息
 */
export async function getChatHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    console.log("开始获取对话历史，会话ID:", conversationId);

    const response = await axiosInstance.post(
      "/ai/messages/queryMessagesByConversationId",
      {
        conversationId,
      }
    );

    console.log("获取到的原始对话历史:", response.data);

    if (isSuccessResponse(response.data.code)) {
      // 将后端返回的消息格式转换为前端使用的格式
      const messages: ChatMessage[] = (response.data.data || []).map(
        (msg: any) => {
          return {
            // 将后端的role转换为前端需要的type
            // 后端role是"user"或"assistant"，前端type是"user"或"ai"
            type: msg.role === "user" ? "user" : "ai",
            content: msg.content || "",
            time: msg.createdTime || getCurrentTime(),
          };
        }
      );

      console.log("转换后的对话历史:", messages);
      return messages;
    } else {
      console.error("获取对话历史失败:", response.data);
      throw new Error(response.data.msg || "获取对话历史失败");
    }
  } catch (error: any) {
    console.error("获取对话历史异常:", error);
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "获取对话历史失败");
    } else {
      throw new Error("网络错误，获取对话历史失败");
    }
  }
}

// 辅助函数：获取当前时间字符串
function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * 更新会话主题
 * @param conversationId 会话ID
 * @param topic 新的会话主题
 */
export async function updateConversationTopic(
  conversationId: string,
  topic: string
): Promise<void> {
  try {
    const response = await axiosInstance.post("/ai/user-conversation/update", {
      conversationId,
      topic,
    });

    if (!isSuccessResponse(response.data.code)) {
      throw new Error(response.data.msg || "更新会话主题失败");
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "更新会话主题失败");
    } else {
      throw new Error("网络错误，更新会话主题失败");
    }
  }
}

/**
 * 删除会话
 * @param conversationId 会话ID
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  try {
    const response = await axiosInstance.post("/ai/user-conversation/delete", {
      conversationId,
    });

    if (!isSuccessResponse(response.data.code)) {
      throw new Error(response.data.msg || "删除会话失败");
    }
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "删除会话失败");
    } else {
      throw new Error("网络错误，删除会话失败");
    }
  }
}
