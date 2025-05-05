<template>
  <div class="chat-layout">
    <!-- 左侧历史对话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>历史对话</h2>
        <div class="sidebar-actions">
          <template v-if="deleteMode">
            <el-button
              type="danger"
              size="small"
              :disabled="selectedConversations.length === 0"
              @click="confirmDelete"
            >
              删除({{ selectedConversations.length }})
            </el-button>
            <el-button type="info" size="small" @click="toggleDeleteMode">
              取消
            </el-button>
          </template>
          <template v-else>
            <el-button
              type="primary"
              size="small"
              plain
              @click="startNewChat"
              :icon="Plus"
            >
              新对话
            </el-button>
            <el-button
              type="danger"
              size="small"
              plain
              @click="toggleDeleteMode"
            >
              批量删除
            </el-button>
          </template>
        </div>
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
          :data-id="chat.conversationId"
          :class="[
            'history-item',
            { active: currentConversationId === chat.conversationId },
            { 'delete-mode': deleteMode },
          ]"
          @click="
            deleteMode
              ? toggleSelection(chat.conversationId)
              : switchChat(chat.conversationId)
          "
        >
          <div class="history-item-content">
            <!-- 添加复选框，在删除模式时显示 -->
            <el-checkbox
              v-if="deleteMode"
              :model-value="selectedConversations.includes(chat.conversationId)"
              @click.stop="toggleSelection(chat.conversationId)"
              :data-id="chat.conversationId"
              class="history-checkbox"
            ></el-checkbox>
            <span class="history-title">{{ chat.topic }}</span>
            <span class="history-time">{{ formatTime(chat.createTime) }}</span>
          </div>
          <div v-if="!deleteMode" class="history-actions">
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

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="showDeleteConfirmDialog"
      title="确认批量删除"
      width="30%"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <span
        >确定要删除选中的
        {{ selectedConversations.length }} 个会话吗？此操作不可恢复。</span
      >
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDelete">取消</el-button>
          <el-button type="danger" @click="deleteSelected" :loading="isDeleting"
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
import axiosInstance from "@/utils/axios"; // 添加这一行导入axios实例

// 判断响应是否成功的辅助函数
const isSuccessResponse = (code: any): boolean => {
  return code === 0 || code === "0" || code === "20039";
};

// 重新实现删除会话函数
const deleteConversation = async (
  param: string | string[] | { conversationIds: string[] }
) => {
  try {
    // 确定要发送的数据结构
    let requestData: { conversationIds: string[] };

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

    console.log("删除请求参数:", JSON.stringify(requestData));

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
};

// 批量删除相关
const deleteMode = ref(false); // 是否处于删除模式
const selectedConversations = ref<string[]>([]); // 已选中要删除的会话ID
const isDeleting = ref(false); // 删除操作中的加载状态
const showDeleteConfirmDialog = ref(false); // 删除确认弹窗
// 创建markdown-it实例并配置
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str: any, lang: any) {
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

// 添加一个消息缓存映射
const messageCache = ref(new Map()); // 最终的完整消息
const generatingContentCache = ref(new Map()); // 仅用于暂存生成中的内容

// 用于定时刷新的定时器引用
let refreshTimerRef: number | null | undefined = null;

// 添加一个Map来跟踪哪些会话正在生成回复
const generatingMessages = ref(new Set());

// 判断会话是否正在生成消息
const isMessageGenerating = (conversationId: string) => {
  return generatingMessages.value.has(conversationId);
};

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

// 辅助函数：查找最后一个AI消息的索引
const findLastAiMessageIndex = (msgArray: Message[]) => {
  for (let i = msgArray.length - 1; i >= 0; i--) {
    if (msgArray[i].type === "ai") {
      return i;
    }
  }
  return -1;
};

// 切换对话
const switchChat = async (conversationId: string) => {
  if (currentConversationId.value === conversationId) return;

  try {
    isLoading.value = true;

    // 如果当前会话有缓存的消息，先保存它们
    if (currentConversationId.value && messages.value.length > 0) {
      messageCache.value.set(currentConversationId.value, [...messages.value]);
    }

    // 重置生成状态，但不停止当前会话的实际生成过程
    isGenerating.value = false;

    // 更新当前会话ID
    currentConversationId.value = conversationId;

    // 清空当前消息区域
    messages.value = [];

    // 检查此会话是否正在生成内容
    const isGeneratingContent = isMessageGenerating(conversationId);

    // 如果是正在生成消息的会话，先尝试从服务器获取最新状态
    if (isGeneratingContent) {
      try {
        // 获取对话历史消息
        const chatHistory = await getChatHistory(conversationId);

        if (chatHistory && chatHistory.length > 0) {
          // 添加历史消息
          messages.value = [...chatHistory];

          // 如果有生成中的内容缓存，需要确保它被添加到正确位置
          if (generatingContentCache.value.has(conversationId)) {
            // 找到最后一组用户-AI消息对
            let userMsgIndex = -1;
            for (let i = messages.value.length - 1; i >= 0; i--) {
              if (messages.value[i].type === "user") {
                userMsgIndex = i;
                break;
              }
            }

            // 如果找到了用户消息，检查是否有紧跟的AI消息
            if (userMsgIndex !== -1) {
              const aiMsgIndex = userMsgIndex + 1;

              // 如果AI消息已存在，更新它的内容
              if (
                aiMsgIndex < messages.value.length &&
                messages.value[aiMsgIndex].type === "ai"
              ) {
                messages.value[aiMsgIndex].content =
                  generatingContentCache.value.get(conversationId);
              }
              // 如果AI消息不存在，插入一个新的AI消息
              else if (aiMsgIndex === messages.value.length) {
                messages.value.push({
                  type: "ai",
                  content: generatingContentCache.value.get(conversationId),
                  time: getCurrentTime(),
                });
              }
            }
          }

          // 设置生成状态
          isGenerating.value = true;
        }
      } catch (error) {
        console.error("获取生成中的对话失败:", error);
        // 其余错误处理保持不变...
      }
    } else if (messageCache.value.has(conversationId)) {
      // 不在生成中且有缓存，直接使用缓存
      messages.value = [...messageCache.value.get(conversationId)];
    } else {
      // 没有缓存也不在生成中，从服务器加载
      try {
        // 获取对话历史消息
        const chatHistory = await getChatHistory(conversationId);

        if (chatHistory && chatHistory.length > 0) {
          // 添加历史消息
          messages.value = chatHistory;
          // 缓存这些消息
          messageCache.value.set(conversationId, [...messages.value]);
        } else {
          // 如果没有历史消息，不添加任何提示，保持空白状态
          messages.value = []; // 不添加欢迎消息
          // 仍然缓存空数组
          messageCache.value.set(conversationId, []);
        }
      } catch (error: any) {
        console.error("获取对话历史失败:", error);
        // 发生错误时也不显示提示消息
        messages.value = []; // 保持空白
      }
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

// 执行删除操作
const confirmDeleteAction = async () => {
  try {
    deletingConversation.value = true;

    // 确保是有效的字符串ID
    if (typeof deletingConversationId.value !== "string") {
      console.error(
        "无效的会话ID类型:",
        typeof deletingConversationId.value,
        deletingConversationId.value
      );
      throw new Error("无效的会话ID");
    }

    // 使用正确的格式调用API
    await deleteConversation({
      conversationIds: [deletingConversationId.value],
    });

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

// 切换删除模式
const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value;
  if (!deleteMode.value) {
    selectedConversations.value = []; // 退出删除模式时清空选中记录
  }
};

// 选中或取消选中会话
const toggleSelection = (conversationId: string) => {
  // 确保传入的是字符串ID
  if (typeof conversationId !== "string") {
    console.error("无效的会话ID类型:", conversationId);
    return;
  }

  const index = selectedConversations.value.indexOf(conversationId);
  if (index >= 0) {
    selectedConversations.value.splice(index, 1); // 移除已选中的
  } else {
    selectedConversations.value.push(conversationId); // 添加新选中的
  }
};

// 打开删除确认对话框
const confirmDelete = (param?: any) => {
  // 如果传入的是事件对象或没有参数，则视为批量删除模式
  if (!param || param instanceof Event || param.isTrusted) {
    // 批量删除模式
    if (selectedConversations.value.length === 0) {
      ElMessage.warning("请至少选择一个对话");
      return;
    }
    showDeleteConfirmDialog.value = true;
  } else {
    // 单个删除模式 - param 是会话ID
    deletingConversationId.value = param;
    deleteDialogVisible.value = true;
  }
};

// 执行批量删除
const deleteSelected = async () => {
  if (selectedConversations.value.length === 0) return;

  try {
    isDeleting.value = true;

    // 复制一份当前选中的会话ID，防止后续操作中被修改
    const conversationsToDelete = [...selectedConversations.value];

    // 检查当前会话是否在选中列表中
    const wasCurrentConversationSelected = conversationsToDelete.includes(
      currentConversationId.value
    );

    console.log("准备删除的会话ID:", conversationsToDelete);

    // 使用正确的格式调用API
    await deleteConversation({ conversationIds: conversationsToDelete });

    // 关闭确认对话框
    showDeleteConfirmDialog.value = false;

    ElMessage.success("删除成功");

    // 如果当前会话在已删除列表中，清空消息并重置当前会话ID
    if (wasCurrentConversationSelected) {
      messages.value = [];
      currentConversationId.value = "";

      // 从消息缓存中移除已删除的会话
      conversationsToDelete.forEach((id) => {
        if (messageCache.value.has(id)) {
          messageCache.value.delete(id);
        }
        if (generatingContentCache.value.has(id)) {
          generatingContentCache.value.delete(id);
        }
        if (generatingMessages.value.has(id)) {
          generatingMessages.value.delete(id);
        }
      });
    }

    // 重新加载会话列表
    await loadConversations();

    // 退出删除模式
    toggleDeleteMode();
  } catch (error: any) {
    console.error("删除会话失败:", error);
    ElMessage.error(`删除会话失败: ${error.message || "请重试"}`);
  } finally {
    isDeleting.value = false;
    showDeleteConfirmDialog.value = false;

    // 确保即使出错也退出删除模式
    if (deleteMode.value) {
      deleteMode.value = false;
      selectedConversations.value = [];
    }
  }
};

// 取消删除操作
const cancelDelete = () => {
  showDeleteConfirmDialog.value = false;
};

// 确保对话框关闭时重置状态
const handleDialogClose = () => {
  isDeleting.value = false;
  // 不再调用 done 函数
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
      // 确保即使出错也清空会话列表，防止显示旧数据
      chatHistory.value = [];
    }

    // 设置总数，用于分页
    if (response.total !== undefined) {
      totalConversations.value = response.total;
    }
  } catch (error) {
    console.error("加载会话列表失败:", error);
    ElMessage.error("获取会话列表失败");
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

// 修改处理用户滚动事件的函数
const handleScroll = () => {
  if (!messageArea.value || isScrolling.value) return;

  const isAtBottom =
    Math.abs(
      messageArea.value.scrollHeight -
        messageArea.value.scrollTop -
        messageArea.value.clientHeight
    ) < 10;

  // 用户手动滚动时，记录状态
  if (!isAtBottom) {
    userScrolling.value = true;
    showScrollButton.value = true;
  } else {
    userScrolling.value = false;
    showScrollButton.value = false;
  }
};

// 处理键盘事件
const handleKeyDown = (event: {
  shiftKey: any;
  preventDefault: () => void;
}) => {
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

  const userMessage = userInput.value.trim();
  userInput.value = ""; // 清空输入框

  // 添加用户消息
  messages.value.push({
    type: "user",
    content: userMessage,
    time: getCurrentTime(),
  });

  isSending.value = true;
  isGenerating.value = true;

  // 记录当前进行请求的会话ID
  const requestConversationId = currentConversationId.value;

  // 标记当前会话正在生成消息
  generatingMessages.value.add(requestConversationId);

  try {
    // 创建AI消息占位
    const aiMessageIndex = messages.value.length;
    messages.value.push({
      type: "ai",
      content: "",
      time: getCurrentTime(),
    });

    // 初始化生成内容缓存
    generatingContentCache.value.set(requestConversationId, "");

    // 更新消息缓存
    messageCache.value.set(requestConversationId, [...messages.value]);

    // 使用封装的API发送请求
    await sendChatMessage(
      userMessage,
      requestConversationId,
      (chunk, responseConversationId) => {
        if (!responseConversationId)
          responseConversationId = requestConversationId;

        // 累加到生成内容缓存中
        const currentContent =
          generatingContentCache.value.get(responseConversationId) || "";
        generatingContentCache.value.set(
          responseConversationId,
          currentContent + chunk
        );

        // 如果是当前显示的对话，更新UI
        if (responseConversationId === currentConversationId.value) {
          messages.value[aiMessageIndex].content =
            generatingContentCache.value.get(responseConversationId);

          // 只有当用户未主动向上滚动时，才自动滚动
          if (!userScrolling.value) {
            scrollToBottom();
          }
        }
      },
      // 响应完成回调
      async (responseConversationId) => {
        if (!responseConversationId)
          responseConversationId = requestConversationId;

        try {
          // 从服务器获取最新的完整消息
          const latestMessages = await getChatHistory(responseConversationId);

          // 更新缓存为服务器最新数据
          if (latestMessages && latestMessages.length > 0) {
            messageCache.value.set(responseConversationId, latestMessages);

            // 如果是当前会话，更新UI
            if (responseConversationId === currentConversationId.value) {
              messages.value = latestMessages;
              isGenerating.value = false;
              scrollToBottom();
            }
          }

          // 清理生成内容缓存，已不再需要
          generatingContentCache.value.delete(responseConversationId);
        } catch (error) {
          console.error("获取完整消息失败:", error);
        }

        // 完成后移除生成标记
        generatingMessages.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          isGenerating.value = false;
          isSending.value = false;
        }

        // 触发自动更新会话主题的逻辑
        const currentChat = chatHistory.value.find(
          (c) => c.conversationId === responseConversationId
        );

        if (
          currentChat &&
          currentChat.topic === "新对话" &&
          messages.value.length <= 3
        ) {
          autoUpdateConversationTopic(
            responseConversationId,
            userMessage,
            currentChat.topic
          )
            .then((newTopic) => {
              if (newTopic) {
                const index = chatHistory.value.findIndex(
                  (c) => c.conversationId === responseConversationId
                );
                if (index !== -1) {
                  chatHistory.value[index].topic = newTopic;
                }
              }
            })
            .catch((error) => {
              console.error("更新会话主题失败:", error);
            });
        }
      },
      // 错误处理
      (error, responseConversationId) => {
        if (!responseConversationId)
          responseConversationId = requestConversationId;

        console.error("聊天请求失败:", error);

        // 清理生成内容缓存
        generatingContentCache.value.delete(responseConversationId);

        // 移除生成标记
        generatingMessages.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          isGenerating.value = false;
          isSending.value = false;

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
      }
    );
  } catch (error: any) {
    console.error("聊天请求失败:", error);

    isGenerating.value = false;
    isSending.value = false;
    generatingMessages.value.delete(requestConversationId);

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

// 修改sendAnalysisPrompt函数
const sendAnalysisPrompt = async (
  billData: {
    totalIncome: any;
    totalExpense: any;
    netIncome: any;
    expenseCategoryDetails: { [s: string]: unknown } | ArrayLike<unknown>;
    incomeCategoryDetails: { [s: string]: unknown } | ArrayLike<unknown>;
    dailyData: any[];
    monthDetails: any[];
  },
  timeRange: string,
  timeDescription: string
) => {
  try {
    isSending.value = true;
    isGenerating.value = true;

    // 标记当前会话正在生成消息
    generatingMessages.value.add(currentConversationId.value);

    // 保存请求时的会话ID，以防在生成过程中用户切换对话
    const requestConversationId = currentConversationId.value;

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
      billData.dailyData.forEach(
        (day: { date: string | number | Date; income: any; expense: any }) => {
          const date = new Date(day.date);
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          prompt += `- ${formattedDate}: 收入 ${day.income} 元, 支出 ${day.expense} 元\n`;
        }
      );
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

    // 初始化生成内容缓存
    generatingContentCache.value.set(requestConversationId, "");

    // 更新消息缓存
    messageCache.value.set(requestConversationId, [...messages.value]);

    let aiResponse = "";

    // 使用封装的API发送请求
    await sendChatMessage(
      prompt,
      requestConversationId,
      (chunk, responseConversationId) => {
        if (!responseConversationId)
          responseConversationId = requestConversationId;

        // 累加到生成内容缓存中
        const currentContent =
          generatingContentCache.value.get(responseConversationId) || "";
        generatingContentCache.value.set(
          responseConversationId,
          currentContent + chunk
        );

        // 如果是当前显示的对话，更新UI
        if (responseConversationId === currentConversationId.value) {
          messages.value[aiMessageIndex].content =
            generatingContentCache.value.get(responseConversationId);

          // 只有当用户未主动向上滚动时，才自动滚动
          if (!userScrolling.value) {
            scrollToBottom();
          }
        }
      },
      // 响应完成回调
      async (responseConversationId) => {
        if (!responseConversationId)
          responseConversationId = requestConversationId;

        try {
          // 从服务器获取最新的完整消息
          const latestMessages = await getChatHistory(responseConversationId);

          // 更新缓存为服务器最新数据
          if (latestMessages && latestMessages.length > 0) {
            messageCache.value.set(responseConversationId, latestMessages);

            // 如果是当前会话，更新UI
            if (responseConversationId === currentConversationId.value) {
              messages.value = latestMessages;
              isGenerating.value = false;
              scrollToBottom();
            }
          }

          // 清理生成内容缓存，已不再需要
          generatingContentCache.value.delete(responseConversationId);
        } catch (error) {
          console.error("获取完整消息失败:", error);
        }

        // 完成后移除生成标记
        generatingMessages.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          isGenerating.value = false;
          isSending.value = false;
        }
      },
      // 错误处理
      (error, responseConversationId) => {
        console.error("账单分析请求失败:", error);

        if (!responseConversationId)
          responseConversationId = requestConversationId;

        // 清理生成内容缓存
        generatingContentCache.value.delete(responseConversationId);

        // 移除生成标记
        generatingMessages.value.delete(responseConversationId);

        if (responseConversationId === currentConversationId.value) {
          isGenerating.value = false;
          isSending.value = false;

          ElMessage({
            message: `分析请求失败: ${error.message}`,
            type: "error",
          });

          messages.value.push({
            type: "system",
            content: "账单分析出错，请稍后重试...",
            time: getCurrentTime(),
          });
        }
      }
    );
  } catch (error) {
    console.error("发送分析提示失败:", error);
    isGenerating.value = false;
    isSending.value = false;
    generatingMessages.value.delete(currentConversationId.value);
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

  // 添加定时刷新机制，每3秒检查一次正在生成的会话
  refreshTimerRef = setInterval(async () => {
    // 对于正在生成中的会话，如果是当前显示的，则更新其显示内容
    if (generatingMessages.value.has(currentConversationId.value)) {
      const generatingContent = generatingContentCache.value.get(
        currentConversationId.value
      );
      if (generatingContent) {
        const lastAiMessageIndex = findLastAiMessageIndex(messages.value);
        if (lastAiMessageIndex !== -1) {
          messages.value[lastAiMessageIndex].content = generatingContent;
        }
      }
    }
  }, 3000); // 每3秒检查一次
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (messageArea.value) {
    messageArea.value.removeEventListener("scroll", handleScroll);
  }

  // 清除定时刷新定时器
  if (refreshTimerRef) {
    clearInterval(refreshTimerRef);
    refreshTimerRef = null;
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

/* 侧边栏头部按钮组样式 */
.sidebar-actions {
  display: flex;
  gap: 8px;
}

/* 删除模式下的历史项样式 */
.history-item.delete-mode {
  cursor: default;
}

.history-item.delete-mode:hover {
  background-color: #f0f2f5;
}

.history-item.delete-mode.active {
  background-color: #e6f7ff;
}

/* 历史项中的复选框样式 */
.history-checkbox {
  margin-right: 8px;
  flex-shrink: 0;
}

/* 历史项内容在删除模式下的样式调整 */
.history-item.delete-mode .history-item-content {
  display: flex;
  flex-direction: row; /* 明确指定水平排列 */
  align-items: center;
}

/* 删除模式下，调整标题和时间的布局 */
.history-item.delete-mode .history-title {
  flex: 1;
  margin-bottom: 0; /* 覆盖常规模式下的下边距 */
}

.history-item.delete-mode .history-time {
  margin-left: 8px;
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
