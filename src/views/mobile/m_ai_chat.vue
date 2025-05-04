<template>
  <div class="chat-layout-mobile">
    <!-- 顶部导航栏 -->
    <van-nav-bar :title="currentChatTitle" fixed placeholder>
      <template #left>
        <van-icon name="wap-nav" size="20" @click="showHistoryPopup = true" />
      </template>
      <template #right>
        <van-icon name="plus" size="20" @click="startNewChat" />
      </template>
    </van-nav-bar>

    <!-- 主聊天区域 -->
    <div class="chat-main-mobile">
      <div class="message-container-mobile">
        <!-- 消息显示区域 -->
        <div
          class="message-area-mobile"
          ref="messageArea"
          @scroll="handleScroll"
        >
          <van-loading
            v-if="isLoading"
            class="loading-container-mobile"
            type="spinner"
            size="24px"
            vertical
          >
            加载中...
          </van-loading>
          <van-empty
            v-else-if="messages.length === 0 && !isLoading"
            description="开始一个新的对话吧"
            image-size="100"
          >
          </van-empty>
          <div
            v-else
            v-for="(msg, index) in messages"
            :key="`${currentConversationId}-${index}`"
            :class="['message-mobile', msg.type]"
          >
            <div class="avatar-container-mobile">
              <van-image
                round
                width="36"
                height="36"
                fit="cover"
                v-if="msg.type === 'user'"
                :src="userAvatar || '/default-avatar.png'"
              />
              <van-image
                round
                width="36"
                height="36"
                fit="cover"
                v-else
                :src="'/alice.jpg'"
              />
            </div>
            <div class="message-content-mobile">
              <div class="message-text-mobile">
                <!-- AI思考中的加载状态 -->
                <template
                  v-if="
                    msg.type === 'ai' &&
                    msg.content === '' &&
                    isMessageGenerating(currentConversationId) &&
                    index === messages.length - 1
                  "
                >
                  <div class="loading-container-mobile">
                    <span class="loading-dot-mobile"></span>
                    <span class="loading-dot-mobile"></span>
                    <span class="loading-dot-mobile"></span>
                  </div>
                </template>
                <!-- 正常消息内容 -->
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
              <div class="message-time-mobile" v-if="msg.time">
                {{ msg.time }}
              </div>
            </div>
          </div>

          <!-- 滚动到底部按钮 -->
          <transition name="van-fade">
            <div
              v-if="showScrollButton && !isScrolling"
              class="scroll-bottom-button-mobile"
              @click="handleScrollToBottom"
            >
              <van-icon name="arrow-down" />
            </div>
          </transition>
        </div>

        <!-- 输入区域 -->
        <div class="input-area-mobile">
          <van-field
            v-model="userInput"
            type="textarea"
            rows="1"
            autosize
            placeholder="请输入..."
            :disabled="!currentConversationId || isSending"
            @keydown="handleKeyDown"
            class="chat-input-mobile"
          />
          <van-button
            type="primary"
            @click="sendMessage"
            :loading="isSending"
            :disabled="
              isSending ||
              !currentConversationId ||
              userInput.trim().length === 0
            "
            icon="guide-o"
            size="small"
            class="send-button-mobile"
          >
          </van-button>
        </div>
      </div>
    </div>

    <!-- 历史记录侧滑栏 -->
    <van-popup
      v-model:show="showHistoryPopup"
      position="left"
      :style="{ width: '75%', height: '100%' }"
    >
      <div class="history-popup-content">
        <van-nav-bar title="历史对话">
          <template #right>
            <van-icon name="plus" size="20" @click="startNewChat" />
          </template>
        </van-nav-bar>
        <van-pull-refresh
          v-model="refreshingHistory"
          @refresh="onHistoryRefresh"
        >
          <van-list
            v-model:loading="loadingHistory"
            :finished="finishedHistory"
            finished-text="没有更多了"
            @load="loadMoreHistory"
            class="history-list-mobile"
          >
            <van-empty
              v-if="chatHistory.length === 0 && !loadingHistory"
              description="暂无历史对话"
            ></van-empty>
            <van-cell
              v-else
              v-for="chat in chatHistory"
              :key="chat.conversationId"
              :title="chat.topic"
              :label="formatTime(chat.createTime)"
              is-link
              :class="{ active: currentConversationId === chat.conversationId }"
              @click="switchChat(chat.conversationId)"
            >
              <template #right-icon>
                <!-- 简单起见，移动端暂时省略编辑和删除按钮，可后续添加 -->
                <!-- <van-icon name="edit" class="history-action-icon" @click.stop="editTopic(chat)" /> -->
                <!-- <van-icon name="delete-o" class="history-action-icon" @click.stop="confirmDelete(chat.conversationId)" /> -->
              </template>
            </van-cell>
          </van-list>
        </van-pull-refresh>
      </div>
    </van-popup>

    <!-- 编辑主题对话框 (如果需要) -->
    <!-- <van-dialog v-model:show="editDialogVisible" title="编辑主题" show-cancel-button @confirm="saveTopic" :before-close="onEditDialogClose">
        <van-field v-model="editingTopic" label="主题" placeholder="请输入新的会话主题" />
      </van-dialog> -->

    <!-- 删除确认对话框 (如果需要) -->
    <!-- <van-dialog v-model:show="deleteDialogVisible" title="确认删除" message="确定要删除这个会话吗？此操作不可恢复。" show-cancel-button @confirm="confirmDeleteAction" :loading="deletingConversation">
      </van-dialog> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, watch, computed } from "vue";
import { ElMessage } from "element-plus"; // 继续使用 ElMessage 或换成 Vant Toast
import { useRoute, useRouter } from "vue-router";
import {
  User,
  Promotion,
  ArrowDown,
  WapNav,
  Plus,
} from "@element-plus/icons-vue"; // 保留可能用到的图标
import {
  sendChatMessage,
  createConversation,
  getConversationHistory,
  getChatHistory,
  updateConversationTopic,
  deleteConversation,
  autoUpdateConversationTopic,
  formatTime,
  getCurrentTime,
  type UserConversation,
  type ChatMessage as ApiChatMessage,
  type PageResponse,
} from "@/api/aiChat";
import { getUserInfos } from "@/api/user";
import MarkdownIt from "markdown-it";
import { v4 as uuidv4 } from "uuid";
import { showToast } from "vant"; // 引入 Vant Toast

// --- Markdown渲染 (与之前相同) ---
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str: any, lang: any) {
    const language = lang || "plaintext";
    return `<pre class="code-block"><code class="language-${language}">${md.utils.escapeHtml(
      str
    )}</code></pre>`;
  },
});
const renderMarkdown = (content: string): string => {
  if (!content) return "";
  return md.render(content);
};

// --- 类型定义 ---
interface Message {
  type: "user" | "ai" | "system";
  content: string;
  time?: string;
}

// --- 响应式状态 ---
const messages = ref<Message[]>([]);
const userInput = ref("");
const isLoading = ref(false); // 消息区域加载状态
const isSending = ref(false); // 发送按钮状态
const messageArea = ref<HTMLElement | null>(null);
const userAvatar = ref<string>("");
const currentConversationId = ref<string>(""); // 当前会话ID

// 滚动相关状态
const userScrolling = ref(false);
const showScrollButton = ref(false);
const isScrolling = ref(false);

// 历史记录相关状态
const showHistoryPopup = ref(false);
const chatHistory = ref<UserConversation[]>([]);
const totalConversations = ref<number>(0);
const currentPage = ref<number>(1);
const pageSize = ref<number>(15); // 移动端每页加载更多条
const loadingHistory = ref(false); // List 加载状态
const finishedHistory = ref(false); // List 是否全部加载完成
const refreshingHistory = ref(false); // PullRefresh 刷新状态

// 缓存 (类似桌面端)
const messageCache = ref(new Map<string, Message[]>()); // 缓存每个会话的消息
const generatingContentCache = ref(new Map<string, string>()); // 缓存正在生成的内容
const generatingMessages = ref(new Set<string>()); // 跟踪正在生成回复的会话ID

// --- 计算属性 ---
const currentChatTitle = computed(() => {
  const current = chatHistory.value.find(
    (c) => c.conversationId === currentConversationId.value
  );
  return current ? current.topic : "AI 助手";
});

// --- 路由 ---
const route = useRoute();
const router = useRouter();

// --- 核心功能 ---

// 判断会话是否正在生成消息
const isMessageGenerating = (conversationId: string) => {
  return generatingMessages.value.has(conversationId);
};

// 加载会话消息
const loadChatMessages = async (conversationId: string) => {
  if (!conversationId) return;
  isLoading.value = true;
  messages.value = []; // 清空现有消息

  // 检查缓存
  if (messageCache.value.has(conversationId)) {
    messages.value = [...messageCache.value.get(conversationId)!];
    console.log(`从缓存加载会话 ${conversationId} 的消息`);
    // 如果缓存的最后一条是空AI消息，且正在生成，则恢复生成状态
    const lastMsg = messages.value[messages.value.length - 1];
    if (
      lastMsg?.type === "ai" &&
      lastMsg.content === "" &&
      isMessageGenerating(conversationId)
    ) {
      // 可以在这里添加一个视觉提示，表示正在恢复生成状态
    }
    isLoading.value = false;
    await scrollToBottom(true);
    return;
  }

  // 检查是否正在生成 (切换回来时)
  if (isMessageGenerating(conversationId)) {
    console.log(`会话 ${conversationId} 正在生成中，尝试恢复...`);
    try {
      const history = await getChatHistory(conversationId);
      if (history && history.length > 0) {
        messages.value = history;
        // 如果有生成中的内容缓存，附加到最后一条AI消息
        if (generatingContentCache.value.has(conversationId)) {
          const lastAiIndex = findLastAiMessageIndex(messages.value);
          if (lastAiIndex !== -1) {
            messages.value[lastAiIndex].content =
              generatingContentCache.value.get(conversationId)!;
          } else {
            // 如果历史记录里没有AI消息（理论上不该发生），则追加
            messages.value.push({
              type: "ai",
              content: generatingContentCache.value.get(conversationId)!,
              time: getCurrentTime(),
            });
          }
        }
        messageCache.value.set(conversationId, [...messages.value]); // 缓存恢复的消息
      } else {
        // 理论上不应发生，但作为回退
        messages.value = [
          {
            type: "ai",
            content: generatingContentCache.value.get(conversationId) || "...",
            time: getCurrentTime(),
          },
        ];
      }
    } catch (error) {
      console.error("恢复生成中对话失败:", error);
      messages.value = [
        { type: "system", content: "加载对话失败", time: getCurrentTime() },
      ];
    } finally {
      isLoading.value = false;
      await scrollToBottom(true);
    }
    return;
  }

  // 从 API 加载
  try {
    console.log(`从API加载会话 ${conversationId} 的消息`);
    const history = await getChatHistory(conversationId);
    if (history && history.length > 0) {
      messages.value = history;
      messageCache.value.set(conversationId, [...messages.value]); // 缓存结果
    } else {
      // 如果没有历史记录，添加欢迎消息
      messages.value.push({
        type: "ai",
        content: "您好！有什么我可以帮助您的吗？",
        time: getCurrentTime(),
      });
      messageCache.value.set(conversationId, [...messages.value]); // 缓存欢迎消息
    }
  } catch (error: any) {
    console.error("加载对话历史失败:", error);
    showToast(`加载对话失败: ${error.message || "请稍后重试"}`);
    messages.value.push({
      type: "system",
      content: "加载对话失败，请稍后重试",
      time: getCurrentTime(),
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom(true); // 加载后滚动到底部
  }
};

// 切换对话
const switchChat = async (conversationId: string) => {
  if (currentConversationId.value === conversationId || isLoading.value) return;

  console.log(`切换到会话: ${conversationId}`);
  // 保存当前可能未缓存的消息 (如果需要)
  if (
    currentConversationId.value &&
    messages.value.length > 0 &&
    !messageCache.value.has(currentConversationId.value)
  ) {
    messageCache.value.set(currentConversationId.value, [...messages.value]);
  }

  currentConversationId.value = conversationId;
  showHistoryPopup.value = false; // 关闭侧边栏
  userInput.value = ""; // 清空输入框
  await loadChatMessages(conversationId);
};

// 启动新对话
const startNewChat = async () => {
  if (isLoading.value || isSending.value) return; // 防止重复创建

  console.log("启动新对话");
  isLoading.value = true;
  showHistoryPopup.value = false; // 关闭侧边栏
  try {
    const conversationId = await createConversation("移动端新对话");
    currentConversationId.value = conversationId;
    messages.value = [
      {
        type: "ai",
        content: "您好！有什么我可以帮助您的吗？",
        time: getCurrentTime(),
      },
    ];
    messageCache.value.set(conversationId, [...messages.value]); // 缓存新对话
    await onHistoryRefresh(); // 创建后刷新历史列表
    await scrollToBottom(true);
  } catch (error: any) {
    showToast(`创建新会话失败: ${error.message}`);
    messages.value = [
      {
        type: "system",
        content: "无法创建新对话，请检查网络连接。",
        time: getCurrentTime(),
      },
    ];
  } finally {
    isLoading.value = false;
  }
};

// 发送消息 (与桌面端逻辑类似，适配移动端)
const sendMessage = async () => {
  if (
    !userInput.value.trim() ||
    isSending.value ||
    !currentConversationId.value
  )
    return;

  const userMessage = userInput.value.trim();
  userInput.value = ""; // 清空输入框

  // 添加用户消息
  const userMsg: Message = {
    type: "user",
    content: userMessage,
    time: getCurrentTime(),
  };
  messages.value.push(userMsg);
  messageCache.get(currentConversationId.value)?.push(userMsg); // 更新缓存
  scrollToBottom();

  isSending.value = true;
  // isGenerating.value = true; // isGenerating 由 isMessageGenerating 控制
  generatingContentCache.value.set(currentConversationId.value, ""); // 重置生成缓存

  // 添加AI消息占位符
  const aiMsgPlaceholder: Message = {
    type: "ai",
    content: "", // 初始为空，显示加载动画
    time: getCurrentTime(),
  };
  messages.value.push(aiMsgPlaceholder);
  const aiMessageIndex = messages.value.length - 1; // 获取占位符索引
  messageCache.get(currentConversationId.value)?.push(aiMsgPlaceholder); // 更新缓存

  const requestConversationId = currentConversationId.value; // 保存当前ID
  generatingMessages.value.add(requestConversationId); // 标记正在生成

  try {
    await sendChatMessage(
      userMessage,
      requestConversationId,
      // onChunk 回调
      (chunk, responseConversationId) => {
        if (responseConversationId === currentConversationId.value) {
          const currentGenContent =
            generatingContentCache.get(responseConversationId) || "";
          const newContent = currentGenContent + chunk;
          generatingContentCache.set(responseConversationId, newContent);

          // 更新UI中的消息内容
          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content = newContent;
          }
          // 更新缓存中的消息内容
          const cachedMsgs = messageCache.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = newContent;
          }

          if (!userScrolling.value) {
            scrollToBottom(); // 流式输出时滚动
          }
        }
      },
      // onComplete 回调
      async (responseConversationId) => {
        if (responseConversationId === currentConversationId.value) {
          generatingMessages.value.delete(responseConversationId); // 移除生成标记
          generatingContentCache.value.delete(responseConversationId); // 清空生成缓存

          // 尝试从服务器获取最终确认的消息，以防丢失chunk
          try {
            const finalHistory = await getChatHistory(responseConversationId);
            const lastAiMsg = finalHistory.findLast((m) => m.type === "ai");
            if (
              lastAiMsg &&
              messages.value[aiMessageIndex] &&
              messages.value[aiMessageIndex].type === "ai"
            ) {
              messages.value[aiMessageIndex].content = lastAiMsg.content;
              // 更新缓存
              const cachedMsgs = messageCache.get(responseConversationId);
              if (
                cachedMsgs &&
                cachedMsgs[aiMessageIndex] &&
                cachedMsgs[aiMessageIndex].type === "ai"
              ) {
                cachedMsgs[aiMessageIndex].content = lastAiMsg.content;
              }
            }
          } catch (err) {
            console.error("获取最终消息失败:", err);
            // 即使获取失败，也保留当前已生成的内容
          } finally {
            isSending.value = false; // 仅在当前会话完成后解除发送锁定
          }

          // 自动更新主题逻辑 (可选)
          const currentChat = chatHistory.value.find(
            (c) => c.conversationId === responseConversationId
          );
          if (
            currentChat &&
            currentChat.topic === "移动端新对话" &&
            messages.value.length <= 3
          ) {
            autoUpdateConversationTopic(
              responseConversationId,
              userMessage,
              currentChat.topic
            ).then((newTopic) => {
              if (newTopic) {
                const index = chatHistory.value.findIndex(
                  (c) => c.conversationId === responseConversationId
                );
                if (index !== -1) chatHistory.value[index].topic = newTopic;
              }
            });
          }
        } else {
          // 如果完成时用户已切换会话，只需清理标记和缓存
          generatingMessages.value.delete(responseConversationId);
          generatingContentCache.value.delete(responseConversationId);
        }
      },
      // onError 回调
      (error, responseConversationId) => {
        console.error("聊天请求失败:", error);
        generatingMessages.value.delete(responseConversationId); // 移除生成标记
        generatingContentCache.value.delete(responseConversationId); // 清空生成缓存

        if (responseConversationId === currentConversationId.value) {
          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content = "抱歉，出错了...";
            messages.value[aiMessageIndex].type = "system"; // 标记为系统错误
          }
          // 更新缓存
          const cachedMsgs = messageCache.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = "抱歉，出错了...";
            cachedMsgs[aiMessageIndex].type = "system";
          }
          isSending.value = false;
          showToast(`请求失败: ${error.message || "请稍后重试"}`);
        }
      }
    );
  } catch (error: any) {
    console.error("发送消息异常:", error);
    generatingMessages.value.delete(requestConversationId);
    generatingContentCache.value.delete(requestConversationId);
    if (requestConversationId === currentConversationId.value) {
      if (
        messages.value[aiMessageIndex] &&
        messages.value[aiMessageIndex].type === "ai"
      ) {
        messages.value[aiMessageIndex].content = "发送失败，请重试。";
        messages.value[aiMessageIndex].type = "system";
      }
      // 更新缓存
      const cachedMsgs = messageCache.get(requestConversationId);
      if (
        cachedMsgs &&
        cachedMsgs[aiMessageIndex] &&
        cachedMsgs[aiMessageIndex].type === "ai"
      ) {
        cachedMsgs[aiMessageIndex].content = "发送失败，请重试。";
        cachedMsgs[aiMessageIndex].type = "system";
      }
      isSending.value = false;
      showToast(`发送失败: ${error.message || "请检查网络"}`);
    }
  }
};

// --- 账单分析相关 (复用桌面逻辑) ---
const handleAnalysisMode = async (
  analysisConversationId: string,
  timeRange: string,
  timeDesc: string
) => {
  const analysisDataStr = localStorage.getItem("billAnalysisData");
  if (!analysisDataStr) {
    showToast("未找到账单分析数据");
    await startNewChat(); // 启动普通新对话
    return;
  }

  try {
    const analysisData = JSON.parse(analysisDataStr);
    localStorage.removeItem("billAnalysisData"); // 清除数据

    // 确保历史列表包含这个会话
    await onHistoryRefresh();
    const exists = chatHistory.value.some(
      (c) => c.conversationId === analysisConversationId
    );
    if (!exists) {
      // 如果刷新后仍然没有，可能需要手动添加或提示错误
      console.warn("分析会话ID未在历史记录中找到:", analysisConversationId);
      // 可以选择创建一个临时的 UserConversation 对象添加到 chatHistory
      chatHistory.value.unshift({
        userId: 0, // 可能需要从后端获取或设为默认
        conversationId: analysisConversationId,
        topic: `${timeDesc}账单分析`,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      });
    }

    currentConversationId.value = analysisConversationId;
    isLoading.value = true;
    messages.value = []; // 清空

    // 显示正在分析的提示
    const analyzingMsg: Message = {
      type: "ai",
      content: `正在为您分析${timeDesc}的账单数据...`,
      time: getCurrentTime(),
    };
    messages.value.push(analyzingMsg);
    messageCache.set(analysisConversationId, [analyzingMsg]); // 缓存初始消息
    scrollToBottom(true);

    // 发送分析请求（不阻塞UI）
    sendAnalysisPrompt(analysisData.data, timeRange, timeDesc);
  } catch (error) {
    console.error("处理账单分析数据失败:", error);
    showToast("处理账单分析数据失败");
    await startNewChat(); // 出错则启动普通新对话
  } finally {
    isLoading.value = false;
  }
};

const sendAnalysisPrompt = async (
  billData: any,
  timeRange: string,
  timeDescription: string
) => {
  if (!currentConversationId.value) {
    console.error("无有效会话ID，无法发送分析请求");
    showToast("无法发送分析请求，请先创建对话");
    return;
  }

  // isSending.value = true; // 分析时不锁定普通发送按钮
  generatingMessages.value.add(currentConversationId.value); // 标记正在生成
  generatingContentCache.value.set(currentConversationId.value, ""); // 重置生成缓存

  const requestConversationId = currentConversationId.value;

  // 准备 Prompt (与桌面版一致)
  let prompt = `我需要你作为一个财务分析专家，分析以下${timeDescription}的账单数据：\n\n`;
  prompt += `总收入: ${billData.totalIncome} 元\n`;
  prompt += `总支出: ${billData.totalExpense} 元\n`;
  prompt += `净收入: ${billData.netIncome} 元\n\n`;
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
  prompt += "\n请对这些财务数据进行详细分析...\n"; // 省略部分重复提示词
  prompt += "6. 针对性的理财建议\n\n请用清晰的标题和小节组织你的分析。";

  // 添加用户侧的提示消息（简短）
  const userPromptMsg: Message = {
    type: "user",
    content: `请帮我分析${timeDescription}的账单`,
    time: getCurrentTime(),
  };
  messages.value.push(userPromptMsg);
  messageCache.get(requestConversationId)?.push(userPromptMsg);

  // 添加AI响应占位符
  const aiPlaceholderMsg: Message = {
    type: "ai",
    content: "",
    time: getCurrentTime(),
  };
  messages.value.push(aiPlaceholderMsg);
  const aiMessageIndex = messages.value.length - 1;
  messageCache.get(requestConversationId)?.push(aiPlaceholderMsg);
  scrollToBottom();

  try {
    await sendChatMessage(
      prompt,
      requestConversationId,
      // onChunk
      (chunk, responseConversationId) => {
        if (responseConversationId === currentConversationId.value) {
          const currentGenContent =
            generatingContentCache.get(responseConversationId) || "";
          const newContent = currentGenContent + chunk;
          generatingContentCache.set(responseConversationId, newContent);

          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content = newContent;
          }
          const cachedMsgs = messageCache.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = newContent;
          }

          if (!userScrolling.value) {
            scrollToBottom();
          }
        }
      },
      // onComplete
      async (responseConversationId) => {
        generatingMessages.value.delete(responseConversationId);
        generatingContentCache.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          // 尝试获取最终消息
          try {
            const finalHistory = await getChatHistory(responseConversationId);
            const lastAiMsg = finalHistory.findLast((m) => m.type === "ai");
            if (
              lastAiMsg &&
              messages.value[aiMessageIndex] &&
              messages.value[aiMessageIndex].type === "ai"
            ) {
              messages.value[aiMessageIndex].content = lastAiMsg.content;
              const cachedMsgs = messageCache.get(responseConversationId);
              if (
                cachedMsgs &&
                cachedMsgs[aiMessageIndex] &&
                cachedMsgs[aiMessageIndex].type === "ai"
              ) {
                cachedMsgs[aiMessageIndex].content = lastAiMsg.content;
              }
            }
          } catch (err) {
            console.error("获取最终分析消息失败:", err);
          }
          // 分析完成不改变 isSending 状态
        }
      },
      // onError
      (error, responseConversationId) => {
        console.error("账单分析请求失败:", error);
        generatingMessages.value.delete(responseConversationId);
        generatingContentCache.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content =
              "分析请求出错，请稍后再试。";
            messages.value[aiMessageIndex].type = "system";
          }
          const cachedMsgs = messageCache.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = "分析请求出错，请稍后再试。";
            cachedMsgs[aiMessageIndex].type = "system";
          }
          showToast(`分析请求失败: ${error.message || "请稍后重试"}`);
        }
      }
    );
  } catch (error: any) {
    console.error("发送分析请求异常:", error);
    generatingMessages.value.delete(requestConversationId);
    generatingContentCache.value.delete(requestConversationId);
    if (requestConversationId === currentConversationId.value) {
      if (
        messages.value[aiMessageIndex] &&
        messages.value[aiMessageIndex].type === "ai"
      ) {
        messages.value[aiMessageIndex].content = "发送分析请求失败。";
        messages.value[aiMessageIndex].type = "system";
      }
      const cachedMsgs = messageCache.get(requestConversationId);
      if (
        cachedMsgs &&
        cachedMsgs[aiMessageIndex] &&
        cachedMsgs[aiMessageIndex].type === "ai"
      ) {
        cachedMsgs[aiMessageIndex].content = "发送分析请求失败。";
        cachedMsgs[aiMessageIndex].type = "system";
      }
      showToast(`发送分析请求失败: ${error.message || "请检查网络"}`);
    }
  }
};

// --- 历史记录加载 ---
const loadHistory = async (
  page = 1,
  size = pageSize.value
): Promise<PageResponse | null> => {
  try {
    const response = await getConversationHistory(page, size);
    return response;
  } catch (error: any) {
    console.error("加载会话历史失败:", error);
    showToast(`加载会话历史失败: ${error.message || "请稍后重试"}`);
    return null;
  }
};

const loadMoreHistory = async () => {
  console.log("加载更多历史记录...");
  loadingHistory.value = true;
  const nextPage = currentPage.value + 1;
  const response = await loadHistory(nextPage, pageSize.value);

  if (response && response.records) {
    chatHistory.value.push(...response.records);
    currentPage.value = nextPage;
    totalConversations.value = response.total;
    // 判断是否加载完成
    finishedHistory.value =
      chatHistory.value.length >= totalConversations.value;
  } else {
    // 加载失败或无数据
    finishedHistory.value = true; // 标记为完成，防止无限加载
  }
  loadingHistory.value = false;
  console.log(
    "加载完成，当前历史:",
    chatHistory.value.length,
    "总数:",
    totalConversations.value
  );
};

const onHistoryRefresh = async () => {
  console.log("下拉刷新历史记录...");
  currentPage.value = 1; // 重置页码
  finishedHistory.value = false; // 重置完成状态
  loadingHistory.value = true; // 显示加载状态
  chatHistory.value = []; // 清空列表

  const response = await loadHistory(currentPage.value, pageSize.value);

  if (response && response.records) {
    chatHistory.value = response.records;
    totalConversations.value = response.total;
    finishedHistory.value =
      chatHistory.value.length >= totalConversations.value;
  } else {
    finishedHistory.value = true;
  }

  loadingHistory.value = false;
  refreshingHistory.value = false; // 结束下拉刷新状态
  console.log(
    "刷新完成，当前历史:",
    chatHistory.value.length,
    "总数:",
    totalConversations.value
  );

  // 如果刷新后没有当前选中的会话ID，且列表不为空，则默认选中第一个
  if (!currentConversationId.value && chatHistory.value.length > 0) {
    await switchChat(chatHistory.value[0].conversationId);
  } else if (chatHistory.value.length === 0) {
    // 如果刷新后列表为空，则创建一个新对话
    await startNewChat();
  }
};

// --- 滚动逻辑 (与之前类似) ---
const scrollToBottom = async (forceScroll = false) => {
  await nextTick();
  if (messageArea.value && (forceScroll || !userScrolling.value)) {
    isScrolling.value = true;
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
    setTimeout(() => {
      isScrolling.value = false;
    }, 150);
  }
};

const handleScrollToBottom = () => {
  userScrolling.value = false;
  scrollToBottom(true);
  showScrollButton.value = false;
};

const handleScroll = () => {
  if (!messageArea.value || isScrolling.value) return;
  const threshold = 100; // 增加阈值
  const isNearBottom =
    messageArea.value.scrollHeight -
      messageArea.value.scrollTop -
      messageArea.value.clientHeight <
    threshold;

  if (!isNearBottom) {
    userScrolling.value = true;
    showScrollButton.value = true;
  } else {
    if (
      messageArea.value.scrollHeight -
        messageArea.value.scrollTop -
        messageArea.value.clientHeight <
      5
    ) {
      userScrolling.value = false;
      showScrollButton.value = false;
    }
  }
};

// --- 输入处理 (与之前类似) ---
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.shiftKey) return;
  if (event.key === "Enter") {
    event.preventDefault();
    if (
      !isSending.value &&
      currentConversationId.value &&
      userInput.value.trim()
    ) {
      sendMessage();
    }
  }
};

// --- 用户信息 ---
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

// --- 辅助函数 ---
const findLastAiMessageIndex = (msgArray: Message[]) => {
  for (let i = msgArray.length - 1; i >= 0; i--) {
    if (msgArray[i].type === "ai") {
      return i;
    }
  }
  return -1;
};

// --- 生命周期钩子 ---
onMounted(async () => {
  await fetchUserInfo();

  // 检查是否从账单分析跳转而来
  if (route.query.mode === "analysis" && route.query.conversationId) {
    await handleAnalysisMode(
      route.query.conversationId as string,
      route.query.timeRange as string,
      route.query.timeDesc as string
    );
  } else {
    // 正常加载，先加载历史记录
    await onHistoryRefresh(); // 使用刷新逻辑来加载第一页并可能选中第一个
    // 如果 onHistoryRefresh 后 currentConversationId 仍为空（例如API出错或无历史记录），则启动新对话
    if (!currentConversationId.value) {
      await startNewChat();
    }
  }

  // 添加滚动监听
  if (messageArea.value) {
    messageArea.value.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  // 移除滚动监听
  if (messageArea.value) {
    messageArea.value.removeEventListener("scroll", handleScroll);
  }
  // 清理可能的定时器等
});
</script>

<style scoped>
/* --- 整体布局 --- */
.chat-layout-mobile {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用 vh 保持全屏 */
  width: 100%;
  background-color: #f4f6f8;
  overflow: hidden;
}

/* --- 导航栏 --- */
:deep(.van-nav-bar__title) {
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Vant NavBar 默认高度是 46px */

/* --- 主内容区 --- */
.chat-main-mobile {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 设置底部内边距等于 van-tabbar 的高度 (50px) */
  padding-bottom: 50px;
}

.message-container-mobile {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* --- 消息样式 --- */
.message-area-mobile {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #ffffff;
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.message-mobile {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  animation: fadeIn 0.3s ease;
  max-width: 90%;
}
.avatar-container-mobile {
  flex-shrink: 0;
  padding-top: 2px;
}
/* van-image 默认是 inline-block，确保尺寸生效 */
.avatar-container-mobile .van-image {
  display: block;
}

.message-content-mobile {
  display: flex;
  flex-direction: column; /* Keep items stacked vertically */
  overflow: hidden;
  flex-grow: 1;
}
/* Align the entire column (bubble + time) to the right for user messages */
.message-mobile.user .message-content-mobile {
  align-items: flex-end;
}
/* Align the entire column (bubble + time) to the left for AI messages */
.message-mobile.ai .message-content-mobile {
  align-items: flex-start;
}

.message-text-mobile {
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;
  line-height: 1.6;
  font-size: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  position: relative;
  background-color: #e9e9eb;
  color: #333;
  width: fit-content;
  max-width: 100%;
}
.message-mobile.user {
  flex-direction: row-reverse;
  margin-left: auto;
}
.message-mobile.user .message-text-mobile {
  background-color: #007aff;
  color: white;
  border-bottom-right-radius: 6px;
}
.message-mobile.ai {
  margin-right: auto;
}
.message-mobile.ai .message-text-mobile {
  background-color: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 6px;
}
.message-mobile.system {
  width: fit-content;
  margin: 10px auto;
  max-width: 80%;
}
.message-mobile.system .message-text-mobile {
  background-color: #e8f4ff;
  color: #555;
  text-align: center;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 10px;
  box-shadow: none;
}
.message-mobile.system .avatar-container-mobile,
.message-mobile.system .message-time-mobile {
  display: none;
}
.message-time-mobile {
  margin-top: 4px; /* Adjust spacing between bubble and time */
  font-size: 11px;
  color: #999;
  padding: 0 5px; /* Optional: slight horizontal padding if needed */
  width: fit-content; /* Ensure time doesn't take unnecessary width */
}

/* --- 输入区域样式 --- */
.input-area-mobile {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 10px;
  background-color: #f8f8f8;
  border-top: 1px solid #e0e0e0;
}
.chat-input-mobile {
  flex: 1;
  background-color: #fff;
  border-radius: 20px;
  padding: 0 !important;
  overflow: hidden;
}
.input-area-mobile :deep(.van-field__control) {
  padding: 8px 12px;
  line-height: 1.5;
  max-height: 80px; /* 限制最大高度约 4-5 行 */
  overflow-y: auto;
  font-size: 16px; /* 确保输入字体大小合适 */
}
.send-button-mobile {
  flex-shrink: 0;
  border-radius: 50% !important;
  width: 38px !important;
  height: 38px !important;
}
/* 调整发送按钮图标大小 */
.send-button-mobile .van-icon {
  font-size: 20px;
}

/* --- 加载动画 --- */
.loading-container-mobile {
  padding: 15px 0;
  text-align: center; /* 让 Vant Loading 居中 */
}
/* 如果使用自定义点动画 */
.loading-dot-container {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 5px 0;
}
.loading-dot-mobile {
  width: 6px;
  height: 6px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}
.loading-dot-mobile:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dot-mobile:nth-child(2) {
  animation-delay: -0.16s;
}
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

/* --- 滚动到底部按钮 --- */
.scroll-bottom-button-mobile {
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background-color: rgba(0, 122, 255, 0.8);
  border-radius: 50%;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
  transition: opacity 0.3s, transform 0.2s;
}
.scroll-bottom-button-mobile:hover {
  background-color: #007aff;
  transform: scale(1.05);
}
.scroll-bottom-button-mobile .van-icon {
  font-size: 18px;
}

/* --- 历史记录侧滑栏 --- */
.history-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f8f8; /* 给侧边栏背景色 */
}
.history-list-mobile {
  flex: 1;
  overflow-y: auto;
}
.history-list-mobile .van-cell {
  padding: 12px 16px;
  transition: background-color 0.2s;
  background-color: #fff; /* 单元格背景 */
  margin-bottom: 1px; /* 单元格间细线 */
}
.history-list-mobile .van-cell.active {
  background-color: #e6f0ff;
}
.history-list-mobile .van-cell__title {
  font-size: 14px;
  color: #333; /* 标题颜色 */
}
.history-list-mobile .van-cell__label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.history-action-icon {
  margin-left: 10px;
  font-size: 18px;
  color: #999;
}
/* 侧边栏 NavBar 样式 */
.history-popup-content .van-nav-bar {
  flex-shrink: 0; /* 防止被压缩 */
}

/* --- Markdown 内容样式微调 --- */
.markdown-body {
  font-size: 15px;
  line-height: 1.6;
  color: #333; /* 统一文字颜色 */
}
.markdown-body p {
  margin-top: 0;
  margin-bottom: 8px;
}
.markdown-body pre {
  margin: 8px 0;
  padding: 10px 12px; /* 稍微增加代码块内边距 */
  font-size: 13px;
  border-radius: 6px;
  background-color: #f0f2f5; /* 代码块背景调整 */
  border: 1px solid #e8e8e8; /* 添加细边框 */
  overflow-x: auto;
  line-height: 1.4; /* 调整代码行高 */
}
.markdown-body code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  background-color: transparent; /* 行内代码无背景 */
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
}
.markdown-body pre code {
  padding: 0; /* pre 里的 code 不需要额外 padding */
  font-size: inherit; /* 继承 pre 的字体大小 */
  background-color: transparent;
  border-radius: 0;
}
.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin-top: 0; /* 列表顶部无额外间距 */
  margin-bottom: 10px; /* 列表底部间距 */
}
.markdown-body li {
  margin-bottom: 5px; /* 列表项间距 */
}
.markdown-body li > p {
  margin-bottom: 5px; /* 列表项内段落间距 */
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 16px; /* 标题上边距 */
  margin-bottom: 8px; /* 标题下边距 */
  font-weight: 600;
}
.markdown-body h1 {
  font-size: 20px;
}
.markdown-body h2 {
  font-size: 18px;
}
.markdown-body h3 {
  font-size: 16px;
}
.markdown-body blockquote {
  margin: 10px 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}
.markdown-body table {
  border-collapse: collapse;
  margin: 10px 0;
  display: block; /* 允许表格横向滚动 */
  overflow-x: auto;
}
.markdown-body th,
.markdown-body td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}
.markdown-body th {
  font-weight: 600;
  background-color: #f6f8fa;
}

/* --- 动画 --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Vant Fade 动画已内置 */
</style>
