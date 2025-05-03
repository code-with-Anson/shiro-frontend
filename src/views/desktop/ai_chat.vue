<template>
  <div class="chat-layout">
    <!-- 左侧历史对话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>历史对话</h2>
        <el-button
          type="primary"
          size="small"
          plain
          @click="startNewChat"
          :icon="Plus"
        >
          新对话
        </el-button>
      </div>

      <div class="history-list">
        <el-empty
          v-if="chatHistory.length === 0"
          description="暂无历史对话"
          :image-size="100"
        ></el-empty>
        <div
          v-else
          v-for="(chat, idx) in chatHistory"
          :key="chat.conversationId"
          :class="[
            'history-item',
            { active: currentConversationId === chat.conversationId },
          ]"
          @click="switchChat(chat.conversationId)"
        >
          <div class="history-item-content">
            <span class="history-title">{{ chat.topic }}</span>
            <span class="history-time">{{ formatTime(chat.createTime) }}</span>
          </div>
          <div class="history-actions">
            <el-tooltip content="编辑主题" placement="top" :hide-after="100">
              <el-icon @click.stop="editTopic(chat)"><Edit /></el-icon>
            </el-tooltip>
            <el-tooltip content="删除对话" placement="top" :hide-after="100">
              <el-icon @click.stop="confirmDelete(chat.conversationId)"
                ><Delete
              /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div
        class="pagination"
        v-if="chatHistory.length > 0 || totalConversations > pageSize"
      >
        <el-pagination
          :size="'small'"
          :background="true"
          layout="prev, pager, next"
          :total="totalConversations"
          :page-size="pageSize"
          :pager-count="5"
          :current-page="currentPage"
          @update:current-page="handlePageChange"
        />
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <div class="message-container">
        <div class="message-area" ref="messageArea">
          <el-empty
            v-if="messages.length === 0"
            description="开始一个新的对话吧"
            :image-size="150"
          >
            <el-button type="primary" @click="startNewChat">新建对话</el-button>
          </el-empty>
          <div
            v-else
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.type]"
          >
            <div class="avatar-container">
              <el-avatar
                :size="40"
                v-if="msg.type === 'user'"
                :src="userAvatar || ''"
                :icon="!userAvatar ? User : undefined"
              />
              <el-avatar :size="40" v-else :src="'/alice.jpg'" />
            </div>
            <div class="message-content">
              <div class="message-text">
                <template
                  v-if="msg.type === 'ai' && msg.content === '' && isGenerating"
                >
                  <div class="loading-container">
                    <span class="loading-dot"></span>
                    <span class="loading-dot"></span>
                    <span class="loading-dot"></span>
                  </div>
                </template>
                <template v-else>
                  <template v-if="msg.type === 'user' || msg.type === 'system'">
                    {{ msg.content }}
                  </template>
                  <div
                    v-else
                    class="markdown-body"
                    v-html="renderMarkdown(msg.content)"
                  ></div>
                </template>
              </div>
              <div class="message-time" v-if="msg.time">{{ msg.time }}</div>
            </div>
          </div>

          <!-- 滚动到底部按钮 -->
          <transition name="fade">
            <div
              v-if="showScrollButton && !isScrolling"
              class="scroll-bottom-button"
              @click="handleScrollToBottom"
            >
              <el-icon><ArrowDown /></el-icon>
            </div>
          </transition>
        </div>

        <div class="input-area">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            :disabled="!currentConversationId"
            @keydown.enter="handleKeyDown"
            resize="none"
          />
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="isSending"
            :disabled="
              isSending ||
              !currentConversationId ||
              userInput.trim().length === 0
            "
            :icon="Promotion"
            size="large"
          >
            发送
          </el-button>
        </div>
        <div class="tips">按Enter发送，Shift+Enter换行</div>
      </div>
    </div>

    <!-- 编辑主题对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑会话主题"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="editingTopic"
        placeholder="请输入新的会话主题"
      ></el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTopic" :loading="savingTopic"
            >保存</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
      :close-on-click-modal="false"
    >
      <span>确定要删除这个会话吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            @click="confirmDeleteAction"
            :loading="deletingConversation"
            >确认删除</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute } from "vue-router";
import {
  Delete,
  Edit,
  User,
  Promotion,
  ArrowDown,
  Plus,
} from "@element-plus/icons-vue";
import {
  sendChatMessage,
  createConversation,
  getConversationHistory,
  updateConversationTopic,
  deleteConversation,
  getChatHistory,
  autoUpdateConversationTopic,
  formatTime,
  getCurrentTime,
  type UserConversation,
  type ChatMessage as ApiChatMessage,
} from "@/api/aiChat";
import { getUserInfos } from "@/api/user";
import MarkdownIt from "markdown-it";
import { v4 as uuidv4 } from "uuid";

// 创建markdown-it实例并配置
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    return `<pre class="code-block"><code class="${lang}">${str}</code></pre>`;
  },
});

// 渲染markdown函数
const renderMarkdown = (content: string): string => {
  if (!content) return "";
  return md.render(content);
};

interface Message {
  type: "user" | "ai" | "system";
  content: string;
  time?: string;
}

const messages = ref<Message[]>([]);
const userInput = ref("");
const isLoading = ref(false); // 用于整体加载状态
const isSending = ref(false); // 专门用于发送按钮状态
const isGenerating = ref(false); // 用于标识AI是否正在生成回复
const messageArea = ref<HTMLElement | null>(null);
const userAvatar = ref<string>("");
const userScrolling = ref(false);
const showScrollButton = ref(false);
const isScrolling = ref(false);
const requestingConversationId = ref<string>(""); // 新增变量

// 会话管理相关状态
const chatHistory = ref<UserConversation[]>([]);
const currentConversationId = ref<string>("");
const totalConversations = ref<number>(0);
const currentPage = ref<number>(1);
const pageSize = ref<number>(8);

// 编辑主题相关
const editDialogVisible = ref<boolean>(false);
const editingTopic = ref<string>("");
const editingConversationId = ref<string>("");
const savingTopic = ref<boolean>(false);

// 删除会话相关
const deleteDialogVisible = ref<boolean>(false);
const deletingConversationId = ref<string>("");
const deletingConversation = ref<boolean>(false);

// 路由对象
const route = useRoute();

// 切换对话
const switchChat = async (conversationId: string) => {
  if (currentConversationId.value === conversationId) return;

  try {
    isLoading.value = true;

    // 重置生成状态，防止旧会话的加载动画继续显示
    isGenerating.value = false;

    // 更新当前会话ID
    currentConversationId.value = conversationId;

    // 清空当前消息
    messages.value = [];

    try {
      // 获取对话历史消息
      const chatHistory = await getChatHistory(conversationId);

      if (chatHistory && chatHistory.length > 0) {
        // 添加历史消息
        messages.value = chatHistory;
      } else {
        // 如果没有历史消息，添加初始消息
        messages.value.push({
          type: "ai",
          content: "已切换到此会话，请继续您的问题...",
          time: getCurrentTime(),
        });
      }
    } catch (error: any) {
      console.error("获取对话历史失败:", error);
      // 发生错误时，也显示提示消息
      messages.value.push({
        type: "ai",
        content: "已切换到此会话，请继续您的问题...",
        time: getCurrentTime(),
      });
    }

    // 滚动到底部
    scrollToBottom(true);
  } finally {
    isLoading.value = false;
  }
};

// 新建对话
const startNewChat = async () => {
  try {
    isLoading.value = true;

    // 创建新会话
    const conversationId = await createConversation("新对话");
    currentConversationId.value = conversationId;

    // 重新加载会话列表
    await loadConversations();

    // 清空当前对话
    messages.value = [];

    // 添加欢迎消息
    messages.value.push({
      type: "ai",
      content: "您好！有什么我可以帮助您的吗？",
      time: getCurrentTime(),
    });

    // 滚动到底部
    scrollToBottom(true);
  } catch (error: any) {
    ElMessage.error(`创建新会话失败: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

// 编辑会话主题
const editTopic = (chat: UserConversation) => {
  editingConversationId.value = chat.conversationId;
  editingTopic.value = chat.topic;
  editDialogVisible.value = true;
};

// 保存编辑后的主题
const saveTopic = async () => {
  if (!editingTopic.value.trim()) {
    ElMessage.warning("会话主题不能为空");
    return;
  }

  try {
    savingTopic.value = true;
    await updateConversationTopic(
      editingConversationId.value,
      editingTopic.value
    );

    // 更新本地会话列表中的主题
    const index = chatHistory.value.findIndex(
      (item) => item.conversationId === editingConversationId.value
    );
    if (index !== -1) {
      chatHistory.value[index].topic = editingTopic.value;
    }

    editDialogVisible.value = false;
    ElMessage.success("会话主题已更新");
  } catch (error: any) {
    ElMessage.error(`更新会话主题失败: ${error.message}`);
  } finally {
    savingTopic.value = false;
  }
};

// 确认删除对话框
const confirmDelete = (conversationId: string) => {
  deletingConversationId.value = conversationId;
  deleteDialogVisible.value = true;
};

// 执行删除操作
const confirmDeleteAction = async () => {
  try {
    deletingConversation.value = true;
    await deleteConversation(deletingConversationId.value);

    // 如果删除的是当前会话，清空消息
    if (deletingConversationId.value === currentConversationId.value) {
      messages.value = [];
      currentConversationId.value = "";
    }

    // 重新加载会话列表
    await loadConversations();

    deleteDialogVisible.value = false;
    ElMessage.success("会话已删除");
  } catch (error: any) {
    ElMessage.error(`删除会话失败: ${error.message}`);
  } finally {
    deletingConversation.value = false;
  }
};

// 分页切换
const handlePageChange = async (page: number) => {
  console.log("页码变更为:", page);

  try {
    // 显示加载状态
    isLoading.value = true;

    // 设置新页码
    currentPage.value = page;

    // 重置选中的会话
    currentConversationId.value = "";

    // 清空消息列表
    messages.value = [];

    // 强制重置会话列表，确保Vue注意到数据变化
    chatHistory.value = [];

    // 等待UI更新
    await nextTick();

    // 重新加载会话列表
    await loadConversations();

    console.log("页面切换后的会话列表:", chatHistory.value);
  } catch (error) {
    console.error("切换页面失败:", error);
    ElMessage.error("加载页面数据失败，请重试");
  } finally {
    isLoading.value = false;
  }
};

// 加载会话历史记录
const loadConversations = async () => {
  try {
    console.log(
      "开始加载会话历史，当前页:",
      currentPage.value,
      "每页数量:",
      pageSize.value
    );

    // 先清空列表，确保UI更新
    chatHistory.value = [];

    // 获取指定页的会话历史
    const response = await getConversationHistory(
      currentPage.value,
      pageSize.value
    );

    console.log("API返回的会话列表数据:", response);

    // 使用全新的数组引用，确保Vue检测到变化
    if (Array.isArray(response.records)) {
      chatHistory.value = [...response.records];
    } else {
      chatHistory.value = [];
      console.warn("API返回的records不是数组:", response.records);
    }

    // 更新总数
    totalConversations.value = parseInt(String(response.total || "0"));

    console.log("更新后的会话列表:", chatHistory.value);

    // 如果有会话但没有选中任何会话，则选中第一个
    if (chatHistory.value.length > 0 && !currentConversationId.value) {
      await switchChat(chatHistory.value[0].conversationId);
    }
  } catch (error) {
    console.error("加载会话历史失败:", error);
    ElMessage.error(
      typeof error === "object" && error !== null && "message" in error
        ? `加载会话历史失败: ${(error as Error).message}`
        : "加载会话历史失败"
    );

    // 确保即使出错也清空会话列表，防止显示旧数据
    chatHistory.value = [];
  }
};

// 修改：滚动到底部的函数
const scrollToBottom = async (forceScroll = false) => {
  await nextTick();
  if (messageArea.value && (forceScroll || !userScrolling.value)) {
    isScrolling.value = true;
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
    setTimeout(() => {
      isScrolling.value = false;
    }, 300);
  }
};

// 按钮点击事件：强制滚动到底部并启用自动滚动
const handleScrollToBottom = () => {
  userScrolling.value = false;
  scrollToBottom(true);
  showScrollButton.value = false;
};

// 处理用户滚动事件
const handleScroll = () => {
  if (!messageArea.value || isScrolling.value) return;

  const isAtBottom =
    Math.abs(
      messageArea.value.scrollHeight -
        messageArea.value.scrollTop -
        messageArea.value.clientHeight
    ) < 10;

  if (!isAtBottom) {
    userScrolling.value = true;
    showScrollButton.value = true;
  } else {
    userScrolling.value = false;
    showScrollButton.value = false;
  }
};

// 处理键盘事件
const handleKeyDown = (event) => {
  // 如果按下Shift键+Enter，允许换行（不做处理）
  if (event.shiftKey) {
    return;
  }

  // 非Shift+Enter情况，阻止默认行为（换行）
  event.preventDefault();

  // 如果满足发送条件，则发送消息
  if (
    !isSending.value &&
    currentConversationId.value &&
    userInput.value.trim()
  ) {
    sendMessage();
  }
};

// 发送消息
const sendMessage = async () => {
  if (
    !userInput.value.trim() ||
    isSending.value ||
    !currentConversationId.value
  )
    return;

  // 添加用户消息
  messages.value.push({
    type: "user",
    content: userInput.value.trim(),
    time: getCurrentTime(),
  });

  const userMessage = userInput.value.trim();
  userInput.value = ""; // 清空输入框，允许用户继续输入

  // 设置发送按钮状态为加载中，但不禁用输入框
  isSending.value = true;
  isGenerating.value = true;

  // 记录当前进行请求的会话ID
  requestingConversationId.value = currentConversationId.value;

  try {
    // 创建AI消息占位
    const aiMessageIndex = messages.value.length;
    messages.value.push({
      type: "ai",
      content: "",
      time: getCurrentTime(),
    });

    let aiResponse = "";

    // 使用封装的API发送请求
    await sendChatMessage(
      userMessage,
      currentConversationId.value,
      (chunk, responseConversationId) => {
        // 检查响应的会话ID是否匹配当前活动的会话ID
        if (responseConversationId === currentConversationId.value) {
          aiResponse += chunk;
          messages.value[aiMessageIndex].content = aiResponse;
          scrollToBottom();
        }
      },
      // 响应完成回调
      (responseConversationId) => {
        if (responseConversationId === currentConversationId.value) {
          isGenerating.value = false;
        }
        // 无论如何都重置发送状态
        isSending.value = false;
      },
      // 错误处理
      (error, responseConversationId) => {
        console.error("聊天请求失败:", error);

        // 只有当错误是关于当前会话时才显示错误消息
        if (responseConversationId === currentConversationId.value) {
          ElMessage({
            message: `聊天请求失败: ${error.message}`,
            type: "error",
          });
          messages.value.push({
            type: "system",
            content: "通信出错！与AI的连接似乎断开了...",
            time: getCurrentTime(),
          });
        }

        // 重置状态
        isGenerating.value = false;
        isSending.value = false;
      }
    );

    // 如果是第一条消息且主题是"新对话"，更新会话主题
    const currentChat = chatHistory.value.find(
      (c) => c.conversationId === currentConversationId.value
    );

    if (
      currentChat &&
      currentChat.topic === "新对话" &&
      messages.value.length <= 3
    ) {
      const newTopic = await autoUpdateConversationTopic(
        currentConversationId.value,
        userMessage,
        currentChat.topic
      );

      // 如果成功更新了主题，同步更新本地状态
      if (newTopic) {
        const index = chatHistory.value.findIndex(
          (c) => c.conversationId === currentConversationId.value
        );
        if (index !== -1) {
          chatHistory.value[index].topic = newTopic;
        }
      }
    }
  } catch (error: any) {
    console.error("聊天请求失败:", error);
    ElMessage({
      message: `聊天请求失败: ${error.message}`,
      type: "error",
    });
    messages.value.push({
      type: "system",
      content: "通信出错！与AI的连接似乎断开了...",
      time: getCurrentTime(),
    });

    // 确保出错时也重置状态
    isGenerating.value = false;
    isSending.value = false;
  }
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const userInfo = await getUserInfos();
    if (userInfo && userInfo.avatar) {
      userAvatar.value = userInfo.avatar;
    }
  } catch (error: any) {
    console.error("获取用户信息失败:", error);
  }
};

// 发送分析提示
const sendAnalysisPrompt = async (billData, timeRange, timeDescription) => {
  try {
    isSending.value = true;
    isGenerating.value = true;

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
      billData.dailyData.forEach((day) => {
        const date = new Date(day.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        prompt += `- ${formattedDate}: 收入 ${day.income} 元, 支出 ${day.expense} 元\n`;
      });
    } else if (timeRange === "month" && billData.dailyData) {
      prompt += "**每日收支数据**:\n";
      billData.dailyData.forEach((day) => {
        const date = new Date(day.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        prompt += `- ${formattedDate}: 收入 ${day.income} 元, 支出 ${day.expense} 元\n`;
      });
    } else if (timeRange === "year" && billData.monthDetails) {
      prompt += "**每月收支数据**:\n";
      billData.monthDetails.forEach((month) => {
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

    // 添加用户消息（隐藏完整提示，只显示简短版本）
    messages.value.push({
      type: "user",
      content: `请分析我的${timeDescription}账单数据`,
      time: getCurrentTime(),
    });

    // 创建AI消息占位
    const aiMessageIndex = messages.value.length;
    messages.value.push({
      type: "ai",
      content: "",
      time: getCurrentTime(),
    });

    let aiResponse = "";

    // 使用封装的API发送请求
    await sendChatMessage(
      prompt,
      currentConversationId.value,
      (chunk) => {
        aiResponse += chunk;
        messages.value[aiMessageIndex].content = aiResponse;
        scrollToBottom();
      },
      // 响应完成回调
      () => {
        isGenerating.value = false;
        isSending.value = false;
      },
      // 错误处理
      (error) => {
        console.error("账单分析请求失败:", error);
        ElMessage({
          message: `分析请求失败: ${error.message}`,
          type: "error",
        });

        messages.value.push({
          type: "system",
          content: "账单分析出错，请稍后重试...",
          time: getCurrentTime(),
        });

        isGenerating.value = false;
        isSending.value = false;
      }
    );
  } catch (error) {
    console.error("发送分析提示失败:", error);
    isGenerating.value = false;
    isSending.value = false;
  }
};

// 修改onMounted中的代码块，调整执行顺序
onMounted(async () => {
  // 获取用户信息和头像
  await fetchUserInfo();

  // 检查是否从账单分析跳转而来
  if (route.query.mode === "analysis" && route.query.conversationId) {
    const analysisConversationId = route.query.conversationId as string;
    const timeRange = route.query.timeRange as string;
    const timeDesc = route.query.timeDesc as string;

    // 从localStorage获取分析数据
    const analysisDataStr = localStorage.getItem("billAnalysisData");
    if (analysisDataStr) {
      try {
        // 解析分析数据
        const analysisData = JSON.parse(analysisDataStr);

        // 设置当前会话ID
        currentConversationId.value = analysisConversationId;

        // 清除localStorage中的分析数据
        localStorage.removeItem("billAnalysisData");

        // 先加载会话历史记录，不等待分析完成
        await loadConversations();

        // 创建自动欢迎消息
        messages.value.push({
          type: "ai",
          content: `正在为您分析${timeDesc}的账单数据...`,
          time: getCurrentTime(),
        });

        // 准备给AI的提示 - 不使用await，允许它在后台运行
        sendAnalysisPrompt(analysisData.data, timeRange, timeDesc);

        // 滚动到底部
        scrollToBottom(true);
        return; // 跳过下方常规初始化逻辑
      } catch (error) {
        console.error("处理账单分析数据失败:", error);
      }
    }
  }

  // 常规初始化逻辑...
  await loadConversations();

  // 如果有选中的会话，加载对话历史记录而不是显示欢迎消息
  if (currentConversationId.value) {
    try {
      isLoading.value = true;
      // 获取对话历史消息
      const chatHistory = await getChatHistory(currentConversationId.value);

      if (chatHistory && chatHistory.length > 0) {
        // 添加历史消息
        messages.value = chatHistory;
      } else {
        // 如果没有历史消息，添加初始欢迎消息
        messages.value.push({
          type: "ai",
          content: "您好！有什么我可以帮助您的吗？",
          time: getCurrentTime(),
        });
      }
    } catch (error: any) {
      console.error("获取对话历史失败:", error);
      // 发生错误时，显示欢迎消息
      messages.value.push({
        type: "ai",
        content: "您好！有什么我可以帮助您的吗？",
        time: getCurrentTime(),
      });
    } finally {
      isLoading.value = false;
    }

    // 滚动到底部
    scrollToBottom(true);
  }

  // 添加滚动事件监听
  if (messageArea.value) {
    messageArea.value.addEventListener("scroll", handleScroll);
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (messageArea.value) {
    messageArea.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
/* 全屏布局 */
.chat-layout {
  display: flex;
  height: 85vh;
  width: 100%;
}

/* 左侧边栏样式 */
.chat-sidebar {
  width: 280px;
  background-color: #f0f2f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.history-item {
  padding: 12px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: #e6e8eb;
}

.history-item.active {
  background-color: #e6f7ff;
  border-left-color: #1890ff;
}

.history-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-title {
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-actions {
  display: flex;
  gap: 8px;
  color: #999;
  visibility: hidden;
}

.history-item:hover .history-actions {
  visibility: visible;
}

.history-actions .el-icon {
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.history-actions .el-icon:hover {
  color: #1890ff;
}

/* 分页样式 */
.pagination {
  padding: 10px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
}

/* 右侧主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.message-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  background-color: #f9fafc;
  scroll-behavior: smooth;
}

/* 消息样式 */
.message {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.avatar-container {
  flex-shrink: 0;
}

.message-content {
  max-width: 800px;
  display: flex;
  flex-direction: column;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  word-break: break-word;
  line-height: 1.5;
  font-size: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-time {
  margin-top: 3px;
  font-size: 12px;
  color: #999;
  align-self: flex-end;
}

.user {
  flex-direction: row-reverse;
}

.user .message-text {
  background-color: #007bff;
  color: white;
  border-bottom-right-radius: 6px;
}

.ai .message-text {
  background-color: #f2f3f5;
  color: #333;
  border-bottom-left-radius: 6px;
}

.system .message-text {
  background-color: #ffcc00;
  color: #333;
  text-align: center;
  margin: 0 auto;
  font-size: 15px;
}

/* 输入区域样式 */
.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background-color: #ffffff;
  border-top: 1px solid #eaeaea;
  align-items: flex-start;
}

.input-area .el-input {
  flex: 1;
}

.input-area .el-textarea :deep(.el-textarea__inner) {
  font-size: 16px;
  padding: 12px 16px;
  line-height: 1.6;
  border-radius: 12px;
  resize: none;
}

.input-area .el-button {
  height: 50px;
  width: 100px;
  font-size: 16px;
}

.tips {
  text-align: center;
  padding: 8px 0 14px;
  color: #999;
  font-size: 14px;
}

/* 加载动画 */
.loading-container {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: #666;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

/* 滚动到底部按钮样式 */
.scroll-bottom-button {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 40px;
  height: 40px;
  background-color: #007bff;
  border-radius: 50%;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 100;
  transition: background-color 0.2s, transform 0.2s;
}

.scroll-bottom-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.scroll-bottom-button .el-icon {
  font-size: 20px;
}

/* 动画 */
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.message-area::-webkit-scrollbar,
.history-list::-webkit-scrollbar {
  width: 6px;
}

.message-area::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.message-area::-webkit-scrollbar-thumb:hover,
.history-list::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
}

.message-area::-webkit-scrollbar-track,
.history-list::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .chat-sidebar {
    width: 240px;
  }

  .scroll-bottom-button {
    bottom: 80px;
    right: 20px;
    width: 36px;
    height: 36px;
  }

  .message-area {
    padding: 20px;
  }

  .input-area {
    padding: 12px 20px;
  }
}
</style>
