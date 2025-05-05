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

          <!-- 添加中央创建新对话按钮 -->
          <div
            v-else-if="!currentConversationId && !isLoading"
            class="create-chat-container"
          >
            <van-empty description="开始一个新的对话吧" image-size="100">
              <template #bottom>
                <van-button
                  type="primary"
                  size="small"
                  icon="plus"
                  round
                  @click="startNewChat"
                >
                  新建对话
                </van-button>
              </template>
            </van-empty>
          </div>

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
            @focus="handleInputFocus"
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
          <template #left>
            <van-icon
              v-if="deleteMode"
              name="cross"
              size="20"
              @click="toggleDeleteMode"
            />
          </template>
          <template #right>
            <div class="history-actions">
              <template v-if="deleteMode">
                <van-button
                  type="danger"
                  size="small"
                  :disabled="selectedConversations.length === 0"
                  @click="confirmDelete"
                >
                  删除({{ selectedConversations.length }})
                </van-button>
              </template>
              <template v-else>
                <van-icon
                  name="delete-o"
                  size="20"
                  @click="toggleDeleteMode"
                  class="history-action-icon"
                />
                <van-icon
                  name="plus"
                  size="20"
                  @click="startNewChat"
                  class="history-action-icon"
                />
              </template>
            </div>
          </template>
        </van-nav-bar>

        <van-pull-refresh
          v-model="refreshingHistory"
          @refresh="onHistoryRefresh"
          :disabled="!canPullRefresh || deleteMode"
          pulling-text="下拉可以刷新..."
          loosing-text="释放立即刷新..."
          success-text="刷新成功"
        >
          <div class="history-list-mobile" @scroll="handleHistoryScroll">
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
              :class="{
                active: currentConversationId === chat.conversationId,
                'delete-mode': deleteMode,
              }"
              @click="
                deleteMode
                  ? toggleSelection(chat.conversationId)
                  : switchChat(chat.conversationId)
              "
            >
              <template #right-icon>
                <!-- 删除模式下显示复选框 -->
                <van-checkbox
                  v-if="deleteMode"
                  :model-value="
                    selectedConversations.includes(chat.conversationId)
                  "
                  @click.stop="toggleSelection(chat.conversationId)"
                />
              </template>
            </van-cell>

            <!-- 加载更多按钮 -->
            <div
              v-if="!finishedHistory && !deleteMode"
              class="load-more-btn"
              @click="loadMoreHistory"
            >
              <van-loading v-if="loadingHistory" size="16" />
              <span v-else
                >加载更多 ({{ chatHistory.length }}/{{
                  totalConversations
                }})</span
              >
            </div>
            <div v-else-if="!deleteMode" class="finished-text">没有更多了</div>
          </div>
        </van-pull-refresh>
      </div>
    </van-popup>

    <!-- 添加确认删除弹窗 -->
    <van-dialog
      v-model:show="showDeleteConfirmDialog"
      title="确认删除"
      message="确定要删除选中的对话吗？此操作不可恢复。"
      show-cancel-button
      @confirm="deleteSelected"
      @cancel="cancelDelete"
      :loading="isDeleting"
      :before-close="handleDialogClose"
    >
    </van-dialog>
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
  deleteConversation as apiDeleteConversation,
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
import axiosInstance from "@/utils/axios"; // 修正导入路径
// 检查 isSuccessResponse 是否在此文件中，或者直接在组件中定义这个函数
// 如果 @/utils/request 文件不存在，你可以在组件内部定义这个辅助函数
const isSuccessResponse = (code: any): boolean => {
  // 成功的返回码可能是0或"20039"
  return code === 0 || code === "0" || code === "20039";
};
// 删除会话
async function deleteConversation(
  param: string | string[] | { conversationIds: string[] }
): Promise<void> {
  try {
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
    } else {
      // 如果是单个ID或ID数组，转换为正确格式
      const ids = Array.isArray(param) ? param : [param];
      requestData = { conversationIds: ids };
    }

    // 输出实际请求数据，帮助调试
    console.log("删除请求参数:", JSON.stringify(requestData));

    // 发送请求
    const response = await axiosInstance.post(
      "/ai/user-conversation/delete",
      requestData
    );

    if (!isSuccessResponse(response.data.code)) {
      throw new Error(response.data.msg || "删除会话失败");
    }
  } catch (error: any) {
    console.error("删除会话失败:", error);
    throw new Error(
      error.response?.data?.msg || error.message || "删除会话失败"
    );
  }
}

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
const appHeight = ref(window.innerHeight);
const updateAppHeight = () => {
  appHeight.value = window.innerHeight;
  document.documentElement.style.setProperty(
    "--app-height",
    `${appHeight.value}px`
  );
};
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

// 批量删除相关状态
const deleteMode = ref(false); // 是否处于删除模式
const selectedConversations = ref<string[]>([]); // 已选中要删除的会话ID
const isDeleting = ref(false); // 删除操作中的加载状态
const showDeleteConfirmDialog = ref(false); // 删除确认弹窗

// 滚动相关状态
const userScrolling = ref(false);
const showScrollButton = ref(false);
const isScrolling = ref(false);
// 添加明确的用户滚动意图标记
const userIntentionalScroll = ref(false);

// 历史记录相关状态
const showHistoryPopup = ref(false);
const chatHistory = ref<UserConversation[]>([]);
const totalConversations = ref<number>(0);
const currentPage = ref<number>(1);
const pageSize = ref<number>(10); // 每次加载 10 条
const loadingHistory = ref(false); // List 加载状态
const finishedHistory = ref(false); // List 是否全部加载完成
const refreshingHistory = ref(false); // PullRefresh 刷新状态

// 添加一个新变量跟踪历史列表的滚动位置
const historyScrollTop = ref(0);
const canPullRefresh = ref(true);

// 添加滚动监听函数
const handleHistoryScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  historyScrollTop.value = target.scrollTop;

  // 只有当滚动到顶部或非常接近顶部时，才允许下拉刷新
  canPullRefresh.value = historyScrollTop.value <= 5;
};

// 添加输入框焦点处理函数
const handleInputFocus = () => {
  // 延迟滚动到底部，等待键盘弹出完成
  setTimeout(() => {
    scrollToBottom(true);
    // 再次调整视口高度
    updateAppHeight();
  }, 400);
};

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
      ElMessage({
        message: `加载对话失败: ${error.message || "请稍后重试"}`,
        type: "error",
        plain: true,
      });
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
    ElMessage({
      message: `加载对话失败: ${error.message || "请稍后重试"}`,
      type: "error",
      plain: true,
    });
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
    // 修改为"新对话"，与桌面端保持一致
    const conversationId = await createConversation("新对话");
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
    ElMessage({
      message: `创建新会话失败: ${error.message}`,
      type: "error",
      plain: true,
    });
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
  messageCache.value.get(currentConversationId.value)?.push(userMsg); // 更新缓存
  scrollToBottom();

  // 检查是否是新会话的第一条消息，如果是，则立即更新标题
  const currentChat = chatHistory.value.find(
    (c) => c.conversationId === currentConversationId.value
  );

  // 添加更多调试信息
  console.log("当前会话信息:", {
    id: currentConversationId.value,
    topic: currentChat?.topic,
    messagesLength: messages.value.length,
  });

  // 修改判断条件：用户消息添加后长度为1或2（可能已有欢迎消息）
  if (
    currentChat &&
    currentChat.topic === "新对话" && // 只保留新的标题格式
    messages.value.length <= 2 // 允许有欢迎消息存在
  ) {
    // 直接使用用户消息作为标题（如果太长则截取）
    let newTitle = userMessage;
    if (newTitle.length > 12) {
      newTitle = newTitle.substring(0, 12) + "...";
    }

    console.log("准备更新标题为:", newTitle);

    // 立即更新会话标题
    try {
      await updateConversationTopic(currentConversationId.value, newTitle);

      // 更新本地缓存的会话列表
      const index = chatHistory.value.findIndex(
        (c) => c.conversationId === currentConversationId.value
      );
      if (index !== -1) {
        chatHistory.value[index].topic = newTitle;
      }
      console.log("已将首次提问设为标题:", newTitle);

      // 强制刷新导航栏标题
      await nextTick();
    } catch (error) {
      console.error("更新会话标题失败:", error);
    }
  }

  // 以下是原有的消息发送逻辑
  isSending.value = true;
  generatingContentCache.value.set(currentConversationId.value, ""); // 重置生成缓存

  // 添加AI消息占位符
  const aiMsgPlaceholder: Message = {
    type: "ai",
    content: "", // 初始为空，显示加载动画
    time: getCurrentTime(),
  };
  messages.value.push(aiMsgPlaceholder);
  const aiMessageIndex = messages.value.length - 1; // 获取占位符索引
  messageCache.value.get(currentConversationId.value)?.push(aiMsgPlaceholder); // 更新缓存

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
            generatingContentCache.value.get(responseConversationId) || "";
          const newContent = currentGenContent + chunk;
          generatingContentCache.value.set(responseConversationId, newContent);

          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content = newContent;
          }
          const cachedMsgs = messageCache.value.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = newContent;
          }

          if (!userIntentionalScroll.value) {
            scrollToBottom(false); // 流式输出时滚动
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
              const cachedMsgs = messageCache.value.get(responseConversationId);
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
          const cachedMsgs = messageCache.value.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = "抱歉，出错了...";
            cachedMsgs[aiMessageIndex].type = "system";
          }
          isSending.value = false;
          ElMessage({
            message: `请求失败: ${error.message || "请稍后重试"}`,
            type: "error",
            plain: true,
          });
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
      const cachedMsgs = messageCache.value.get(requestConversationId);
      if (
        cachedMsgs &&
        cachedMsgs[aiMessageIndex] &&
        cachedMsgs[aiMessageIndex].type === "ai"
      ) {
        cachedMsgs[aiMessageIndex].content = "发送失败，请重试。";
        cachedMsgs[aiMessageIndex].type = "system";
      }
      isSending.value = false;
      ElMessage({
        message: `发送失败: ${error.message || "请检查网络"}`,
        type: "error",
        plain: true,
      });
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
    ElMessage({
      message: "未找到账单分析数据",
      type: "warning",
      plain: true,
    });
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
    messageCache.value.set(analysisConversationId, [analyzingMsg]); // 缓存初始消息
    scrollToBottom(true);

    // 发送分析请求（不阻塞UI）
    sendAnalysisPrompt(analysisData.data, timeRange, timeDesc);
  } catch (error) {
    console.error("处理账单分析数据失败:", error);
    ElMessage({
      message: "处理账单分析数据失败",
      type: "error",
      plain: true,
    });
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
    ElMessage({
      message: "无法发送分析请求，请先创建对话",
      type: "warning",
      plain: true,
    });
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
  messageCache.value.get(requestConversationId)?.push(userPromptMsg);

  // 添加AI响应占位符
  const aiPlaceholderMsg: Message = {
    type: "ai",
    content: "",
    time: getCurrentTime(),
  };
  messages.value.push(aiPlaceholderMsg);
  const aiMessageIndex = messages.value.length - 1;
  messageCache.value.get(requestConversationId)?.push(aiPlaceholderMsg);
  scrollToBottom();

  try {
    await sendChatMessage(
      prompt,
      requestConversationId,
      // onChunk
      (chunk, responseConversationId) => {
        if (responseConversationId === currentConversationId.value) {
          const currentGenContent =
            generatingContentCache.value.get(responseConversationId) || "";
          const newContent = currentGenContent + chunk;
          generatingContentCache.value.set(responseConversationId, newContent);

          if (
            messages.value[aiMessageIndex] &&
            messages.value[aiMessageIndex].type === "ai"
          ) {
            messages.value[aiMessageIndex].content = newContent;
          }
          const cachedMsgs = messageCache.value.get(responseConversationId);
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
              const cachedMsgs = messageCache.value.get(responseConversationId);
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
          const cachedMsgs = messageCache.value.get(responseConversationId);
          if (
            cachedMsgs &&
            cachedMsgs[aiMessageIndex] &&
            cachedMsgs[aiMessageIndex].type === "ai"
          ) {
            cachedMsgs[aiMessageIndex].content = "分析请求出错，请稍后再试。";
            cachedMsgs[aiMessageIndex].type = "system";
          }
          ElMessage({
            message: `分析请求失败: ${error.message || "请稍后重试"}`,
            type: "error",
            plain: true,
          });
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
      const cachedMsgs = messageCache.value.get(requestConversationId);
      if (
        cachedMsgs &&
        cachedMsgs[aiMessageIndex] &&
        cachedMsgs[aiMessageIndex].type === "ai"
      ) {
        cachedMsgs[aiMessageIndex].content = "发送分析请求失败。";
        cachedMsgs[aiMessageIndex].type = "system";
      }
      ElMessage({
        message: `发送分析请求失败: ${error.message || "请检查网络"}`,
        type: "error",
        plain: true,
      });
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
    ElMessage({
      message: `加载会话历史失败: ${error.message || "请稍后重试"}`,
      type: "error",
      plain: true,
    });
    return null;
  }
};

const loadMoreHistory = async () => {
  // 不再需要检查 loading 状态，因为按钮点击时会禁用
  console.log("手动加载更多历史记录...");

  if (loadingHistory.value) return; // 防止重复点击
  if (finishedHistory.value) return; // 已经没有更多数据

  loadingHistory.value = true;
  const nextPage = currentPage.value + 1;
  console.log(`请求页码: ${nextPage}, 每页大小: ${pageSize.value}`);

  try {
    const response = await loadHistory(nextPage, pageSize.value);
    console.log("加载更多 API 响应:", response);

    if (response && response.records && response.records.length > 0) {
      chatHistory.value.push(...response.records);
      currentPage.value = nextPage;
      totalConversations.value = response.total;

      // 检查是否已加载所有数据
      finishedHistory.value =
        chatHistory.value.length >= totalConversations.value;
      console.log(
        `更新后: 当前页=${currentPage.value}, 总数=${totalConversations.value}, 列表长度=${chatHistory.value.length}`
      );
    } else {
      // 没有更多数据或 API 返回空结果
      finishedHistory.value = true;
    }
  } catch (error) {
    console.error("加载更多失败:", error);
    ElMessage({
      message: "加载更多失败，请重试",
      type: "error",
      plain: true,
    });
  } finally {
    loadingHistory.value = false;
  }
};

const onHistoryRefresh = async () => {
  console.log("下拉刷新历史记录...");
  currentPage.value = 1;
  finishedHistory.value = false;
  // 注意这里不立即设置为 true，而是用临时变量记录状态
  // loadingHistory.value = true;
  const isRefreshing = true;
  chatHistory.value = [];

  console.log(`请求页码: ${currentPage.value}, 每页大小: ${pageSize.value}`);
  const response = await loadHistory(currentPage.value, pageSize.value);
  console.log("刷新 API 响应:", response);

  if (response && response.records) {
    chatHistory.value = response.records;
    totalConversations.value = response.total;
    console.log(
      `刷新后: 总数=${totalConversations.value}, 列表长度=${chatHistory.value.length}`
    );

    // 重新计算 finished 状态
    finishedHistory.value =
      chatHistory.value.length >= totalConversations.value;
    console.log(`计算 finished 状态: ${finishedHistory.value}`);
  } else {
    finishedHistory.value = true;
    console.error("刷新失败或无数据，标记为 finished");
  }

  // 使用 setTimeout 延迟关闭 loadingHistory 状态
  setTimeout(() => {
    loadingHistory.value = false;
    console.log("loadingHistory 延迟设置为 false");
  }, 200); // 200毫秒的延迟，确保 DOM 已更新

  // 使用 setTimeout 结束下拉刷新状态，确保视觉效果正常
  setTimeout(async () => {
    refreshingHistory.value = false;
    console.log("刷新结束.");

    // 修改后的逻辑：只有历史记录不为空且没有当前会话时，才选择第一个会话
    if (!currentConversationId.value && chatHistory.value.length > 0) {
      await switchChat(chatHistory.value[0].conversationId);
    }
  }, 300);
};

// --- 滚动逻辑 (与之前类似) ---
const scrollToBottom = async (forceScroll = false) => {
  await nextTick();
  // 当强制滚动时，重置用户滚动意图
  if (forceScroll) {
    userIntentionalScroll.value = false;
  }

  // 仅当强制滚动或没有用户滚动意图时才滚动
  if (messageArea.value && (forceScroll || !userIntentionalScroll.value)) {
    isScrolling.value = true;
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
    setTimeout(() => {
      isScrolling.value = false;
    }, 150);
  }
};

const handleScrollToBottom = () => {
  userScrolling.value = false;
  userIntentionalScroll.value = false; // 重置用户明确滚动意图
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

  // 保存之前的状态
  const prevState = userIntentionalScroll.value;

  if (!isNearBottom) {
    userScrolling.value = true;
    userIntentionalScroll.value = true; // 设置明确的用户意图标志
    showScrollButton.value = true;

    // 只在状态变化时记录日志
    if (!prevState) {
      console.log("用户向上滚动，禁用自动滚动", {
        scrollHeight: messageArea.value.scrollHeight,
        scrollTop: messageArea.value.scrollTop,
        clientHeight: messageArea.value.clientHeight,
      });
    }
  } else {
    // 接近底部时（5像素内）重置滚动状态
    if (
      messageArea.value.scrollHeight -
        messageArea.value.scrollTop -
        messageArea.value.clientHeight <
      5
    ) {
      userScrolling.value = false;
      userIntentionalScroll.value = false; // 重置用户意图标志
      showScrollButton.value = false;

      // 只在状态变化时记录日志
      if (prevState) {
        console.log("用户已到底部，启用自动滚动");
      }
    }
  }
};

// 在handleScroll函数后添加
// 判断是否应该自动滚动
const shouldAutoScroll = () => {
  // 如果用户有明确滚动意图，不自动滚动
  if (userIntentionalScroll.value) {
    console.log(`自动滚动判断: false (用户有滚动意图)`);
    return false;
  }

  // 没有明确滚动意图时，允许自动滚动
  return true;
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

// 切换删除模式
const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value;
  if (!deleteMode.value) {
    selectedConversations.value = []; // 退出删除模式时清空选中记录
  }
};

// 选中或取消选中会话
const toggleSelection = (conversationId: string) => {
  const index = selectedConversations.value.indexOf(conversationId);
  if (index >= 0) {
    selectedConversations.value.splice(index, 1); // 移除已选中的
  } else {
    selectedConversations.value.push(conversationId); // 添加新选中的
  }
};

// 打开删除确认对话框
const confirmDelete = () => {
  if (selectedConversations.value.length === 0) {
    ElMessage({
      message: "请至少选择一个对话",
      type: "warning",
      plain: true,
    });
    return;
  }
  showDeleteConfirmDialog.value = true;
};

// 执行批量删除
const deleteSelected = async () => {
  if (selectedConversations.value.length === 0) return;

  isDeleting.value = true;
  // 复制一份当前选中的会话ID，防止后续操作中被修改
  const conversationsToDelete = [...selectedConversations.value];
  const wasCurrentConversationSelected = conversationsToDelete.includes(
    currentConversationId.value
  );

  try {
    // 修改这一行，使用对象格式传递参数
    await deleteConversation({ conversationIds: conversationsToDelete });

    // 成功后先关闭弹窗和加载状态，再执行其他操作
    showDeleteConfirmDialog.value = false;
    isDeleting.value = false;

    ElMessage({
      message: "删除成功",
      type: "success",
      plain: true,
    });

    // 刷新历史记录
    await onHistoryRefresh().catch((err) => {
      console.error("刷新历史记录失败:", err);
      // 即使刷新失败也继续后续操作
    });

    // 如果当前会话在已删除列表中，创建一个新会话
    if (wasCurrentConversationSelected) {
      await startNewChat().catch((err) => {
        console.error("创建新会话失败:", err);
        // 即使创建失败也要继续
      });
    }

    // 最后退出删除模式
    toggleDeleteMode();
  } catch (error: any) {
    console.error("删除会话失败:", error);
    ElMessage({
      message: `删除失败: ${error.message || "请重试"}`,
      type: "error",
      plain: true,
    });
  } finally {
    // 确保无论如何都重置状态
    isDeleting.value = false;
    showDeleteConfirmDialog.value = false;

    // 如果删除模式仍然开启（可能是因为toggleDeleteMode失败），强制关闭
    if (deleteMode.value) {
      deleteMode.value = false;
      selectedConversations.value = [];
    }
  }
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirmDialog.value = false;
  // 确保取消时也重置加载状态
  isDeleting.value = false;
};

// 添加关闭对话框的处理函数
const handleDialogClose = (action, done) => {
  // 如果正在删除中，阻止关闭
  if (action === "confirm" && isDeleting.value) {
    return;
  }

  // 重置状态
  if (action === "cancel") {
    isDeleting.value = false;
  }

  // 允许关闭对话框
  done();
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
    // 正常加载，只加载历史记录，不自动创建新对话
    await onHistoryRefresh();
  }

  // 添加滚动监听
  if (messageArea.value) {
    messageArea.value.addEventListener("scroll", handleScroll);
  }

  // 添加视口高度调整
  updateAppHeight();
  window.addEventListener("resize", updateAppHeight);

  // 为输入框添加焦点事件
  const inputField = document.querySelector(".chat-input-mobile textarea");
  if (inputField) {
    inputField.addEventListener("focus", () => {
      // 输入框获取焦点时延迟滚动到底部
      setTimeout(() => scrollToBottom(true), 300);
    });
  }
});

onUnmounted(() => {
  // 移除滚动监听
  if (messageArea.value) {
    messageArea.value.removeEventListener("scroll", handleScroll);
  }
  // 移除窗口大小变化监听
  window.removeEventListener("resize", updateAppHeight);
});
</script>

<style scoped>
:root {
  --app-height: 100vh;
}
/* --- 整体布局 --- */
.chat-layout-mobile {
  display: flex;
  flex-direction: column;
  height: var(--app-height); /* 使用自定义变量替代 100vh */
  width: 100%;
  background-color: #f4f6f8;
  overflow: hidden;
  position: fixed; /* 添加固定定位 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  position: relative; /* 添加相对定位 */
  z-index: 100; /* 增加层级，确保始终可见 */
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
  width: 100%; /* 确保宽度也是100% */
  background-color: #f8f8f8;
  overflow: hidden;
}

/* 修复 van-pull-refresh 高度问题 */
.history-popup-content :deep(.van-pull-refresh) {
  flex: 1;
  height: calc(100% - 46px); /* 减去导航栏高度 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 增强滚动容器设置 */
.history-list-mobile {
  flex: 1;
  height: 100%; /* 使用100%高度而不是0 */
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 20px;
}

/* 确保 van-cell 能够正确呈现 */
.history-list-mobile .van-cell {
  width: 100%;
  padding: 12px 16px;
  transition: background-color 0.2s;
  background-color: #fff;
  margin-bottom: 1px;
  box-sizing: border-box;
}

/* 激活状态样式 */
.history-list-mobile .van-cell.active {
  background-color: #e6f0ff;
}

/* 删除模式样式 */
.history-list-mobile .van-cell.delete-mode {
  background-color: #fff;
}

.history-list-mobile .van-cell.delete-mode.active {
  background-color: #f0f0f0;
}

.history-list-mobile .van-cell.delete-mode:active {
  background-color: #f0f0f0;
}

/* 复选框样式调整 */
.history-list-mobile :deep(.van-checkbox) {
  margin-right: 4px;
}

/* 删除按钮样式 */
.van-button--danger.van-button--small {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

/* 加载更多按钮样式 */
.load-more-btn {
  width: calc(100% - 16px);
  padding: 12px;
  margin: 8px;
  text-align: center;
  color: #1989fa;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  box-sizing: border-box;
}

.finished-text {
  width: 100%;
  padding: 10px;
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 5px;
  box-sizing: border-box;
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

/* --- 加载更多按钮样式 --- */
.load-more-btn {
  padding: 12px;
  margin: 8px;
  text-align: center;
  color: #1989fa;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background-color 0.3s;
}

/* 历史记录动作按钮区域 */
.history-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-action-icon {
  cursor: pointer;
  margin-left: 10px;
}

.load-more-btn:active {
  background-color: #f2f8ff;
}

.finished-text {
  padding: 10px;
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 5px;
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

/* 添加居中的创建对话按钮容器 */
.create-chat-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.create-chat-container .van-button {
  margin-top: 16px;
  padding: 0 20px;
  height: 40px;
  font-size: 16px;
}
</style>
