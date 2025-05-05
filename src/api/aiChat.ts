import axiosInstance from "@/utils/axios";
import type { AxiosProgressEvent } from "axios";
import { v4 as uuidv4 } from "uuid";

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
  pages?: number; // 添加总页数字段
}

// 聊天消息接口定义
export interface ChatMessage {
  type: "user" | "ai" | "system";
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
 * @param onComplete 响应完成后的回调函数
 * @param onError 发生错误时的回调函数
 */
export async function sendChatMessage(
  message: string,
  conversationId: string,
  onChunk: (chunk: string, responseConversationId: string) => void,
  onComplete?: (responseConversationId: string) => void,
  onError?: (error: any, responseConversationId: string) => void
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
              // 传递会话ID以便调用者可以验证
              onChunk(newChunk, conversationId);
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

    // 调用完成回调函数
    if (onComplete) {
      onComplete(conversationId);
    }
  } catch (error: any) {
    if (onError) {
      onError(error, conversationId);
    } else {
      if (error.response?.data) {
        throw new Error(error.response.data.msg || "请求失败");
      } else if (error.request) {
        throw new Error("网络错误，请稍后重试");
      } else {
        throw new Error(error.message || "请求失败，请稍后重试");
      }
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
  pageSize: number = 8
): Promise<PageResponse> {
  try {
    // 强制确保参数是数字类型
    const numericCurrentPage = Number(currentPage);
    const numericPageSize = Number(pageSize);

    console.log(
      `发送获取会话历史请求: 页码=${numericCurrentPage}, 每页=${numericPageSize}`
    );

    const response = await axiosInstance.post("/ai/user-conversation/history", {
      currentPage: numericCurrentPage,
      pageSize: numericPageSize,
    });

    // 打印更详细的响应信息，帮助调试
    console.log("API原始返回数据:", response.data);

    if (isSuccessResponse(response.data.code)) {
      // 确保返回数字类型
      const data = response.data.data || {};
      return {
        records: Array.isArray(data.records) ? data.records : [],
        total: parseInt(data.total) || 0,
        size: parseInt(data.size) || numericPageSize,
        current: parseInt(data.current) || numericCurrentPage,
        pages:
          parseInt(data.pages) ||
          Math.ceil(parseInt(data.total || "0") / numericPageSize),
      };
    } else {
      console.error("获取会话历史失败:", response.data);
      throw new Error(response.data.msg || "获取会话历史失败");
    }
  } catch (error: any) {
    console.error("获取会话历史异常:", error);
    throw new Error(
      error.response?.data?.msg || error.message || "获取会话历史失败"
    );
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
 * @param param 会话ID或ID数组
 */
export async function deleteConversation(
  param: string | string[] | { conversationIds: string[] }
): Promise<void> {
  try {
    console.log("deleteConversation接收到的原始参数:", param);
    console.log("参数类型:", typeof param, Array.isArray(param));

    // 确定要发送的数据结构
    let requestData: { conversationIds: string[] };

    // 处理不同类型的输入
    if (
      typeof param === "object" &&
      !Array.isArray(param) &&
      "conversationIds" in param
    ) {
      // 如果是 {conversationIds: [...]} 格式，直接使用
      requestData = param;
      console.log("使用对象格式参数:", requestData);
    } else {
      // 如果是单个ID或ID数组，转换为正确格式
      const ids = Array.isArray(param) ? param : [param];
      requestData = { conversationIds: ids };
      console.log("转换后的参数格式:", requestData);
    }

    // 输出实际请求数据，帮助调试
    console.log("最终发送的请求数据:", JSON.stringify(requestData));
    console.log(
      "conversationIds类型:",
      Array.isArray(requestData.conversationIds)
    );

    // 检查axiosInstance配置
    console.log("请求URL:", "/ai/user-conversation/delete");
    console.log("请求头:", axiosInstance.defaults.headers);

    // 发送请求
    const response = await axiosInstance.post(
      "/ai/user-conversation/delete",
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API响应:", response.data);

    if (!isSuccessResponse(response.data.code)) {
      throw new Error(response.data.msg || "删除会话失败");
    }
  } catch (error: any) {
    console.error("删除会话失败详情:", error);
    // 如果有响应数据，输出更详细的错误信息
    if (error.response) {
      console.error("错误响应状态:", error.response.status);
      console.error("错误响应数据:", error.response.data);
    }
    throw new Error(
      error.response?.data?.msg || error.message || "删除会话失败"
    );
  }
}

/**
 * 根据用户第一条消息自动更新会话主题
 * @param conversationId 会话ID
 * @param userMessage 用户消息
 * @param currentTopic 当前主题
 */
export async function autoUpdateConversationTopic(
  conversationId: string,
  userMessage: string,
  currentTopic: string
): Promise<string | null> {
  // 只有当当前主题是"新对话"时才自动更新
  if (currentTopic !== "新对话") {
    return null;
  }

  const newTopic =
    userMessage.length > 15
      ? userMessage.substring(0, 15) + "..."
      : userMessage;

  try {
    await updateConversationTopic(conversationId, newTopic);
    return newTopic;
  } catch (error) {
    console.error("自动更新会话主题失败:", error);
    return null;
  }
}

// 格式化时间函数
export function formatTime(timeStr: string): string {
  if (!timeStr) return "";

  const date = new Date(timeStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else if (isYesterday) {
    return `昨天 ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

// 辅助函数：获取当前时间字符串
export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * AI分析账单数据
 * @param billData 账单数据
 * @param timeRange 时间范围('week'|'month'|'year')
 * @param timeDescription 时间描述，如"2025年5月"
 * @returns 分析结果文本
 */
export async function analyzeBillData(
  billData: any,
  timeRange: "week" | "month" | "year",
  timeDescription: string
): Promise<string> {
  try {
    // 创建一个新的会话用于分析
    const conversationId = await createConversation(
      `${timeDescription}账单分析`
    );

    // 准备发送给AI的消息
    let prompt = `我需要你作为一个财务分析专家，分析以下${timeDescription}的账单数据：\n\n`;

    // 添加基本财务信息
    prompt += `总收入: ${billData.totalIncome} 元\n`;
    prompt += `总支出: ${billData.totalExpense} 元\n`;
    prompt += `净收入: ${billData.netIncome} 元\n\n`;

    // 添加支出分类明细
    if (
      billData.expenseCategoryDetails &&
      Object.keys(billData.expenseCategoryDetails).length > 0
    ) {
      prompt += "**支出分类明细**:\n";
      Object.entries(billData.expenseCategoryDetails).forEach(
        ([category, amount]) => {
          prompt += `- ${category}: ${amount} 元\n`;
        }
      );
      prompt += "\n";
    }

    // 添加收入分类明细
    if (
      billData.incomeCategoryDetails &&
      Object.keys(billData.incomeCategoryDetails).length > 0
    ) {
      prompt += "**收入分类明细**:\n";
      Object.entries(billData.incomeCategoryDetails).forEach(
        ([category, amount]) => {
          prompt += `- ${category}: ${amount} 元\n`;
        }
      );
      prompt += "\n";
    }

    // 添加时间维度数据
    if (timeRange === "week" && billData.dailyData) {
      prompt += "**每日收支数据**:\n";
      billData.dailyData.forEach((day: any) => {
        const date = new Date(day.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        prompt += `- ${formattedDate}: 收入 ${day.income} 元, 支出 ${day.expense} 元\n`;
      });
    } else if (timeRange === "month" && billData.dailyData) {
      prompt += "**每日收支数据**:\n";
      billData.dailyData.forEach((day: any) => {
        const date = new Date(day.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        prompt += `- ${formattedDate}: 收入 ${day.income} 元, 支出 ${day.expense} 元\n`;
      });
    } else if (timeRange === "year" && billData.monthDetails) {
      prompt += "**每月收支数据**:\n";
      billData.monthDetails.forEach((month: any) => {
        prompt += `- ${month.month}月: 收入 ${month.income} 元, 支出 ${month.expense} 元\n`;
      });
    }

    prompt += "\n请对这些财务数据进行详细分析，包括但不限于：\n";
    prompt += "1. 总体收支情况评估\n";
    prompt += "2. 主要支出类别分析\n";
    prompt += "3. 收入来源分析\n";
    prompt += "4. 时间趋势分析\n";
    prompt += "5. 财务健康度评估\n";
    prompt += "6. 针对性的理财建议\n";
    prompt +=
      "\n请用清晰的标题和小节组织你的分析，并尽可能提供实用的改进建议。";

    // 存储AI回复
    let aiResponse = "";

    // 发送消息到AI并等待完整回复
    await new Promise<void>((resolve, reject) => {
      sendChatMessage(
        prompt,
        conversationId,
        (chunk) => {
          aiResponse += chunk;
        },
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        }
      );
    });

    return aiResponse;
  } catch (error: any) {
    console.error("账单分析失败:", error);
    throw new Error(error.message || "账单分析请求失败");
  }
}
