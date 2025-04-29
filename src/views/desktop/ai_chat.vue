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
        <div
          v-for="(chat, idx) in chatHistory"
          :key="idx"
          :class="['history-item', { active: chat.active }]"
          @click="switchChat(idx)"
        >
          <span class="history-title">{{ chat.title }}</span>
          <span class="history-time">{{ chat.time }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <div class="message-container">
        <div class="message-area" ref="messageArea">
          <div
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
                  v-if="msg.type === 'ai' && msg.content === '' && isLoading"
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
            :disabled="isLoading"
            @keyup.enter.ctrl="sendMessage"
            resize="none"
          />
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="isLoading"
            :icon="Promotion"
            size="large"
          >
            发送
          </el-button>
        </div>
        <div class="tips">按Ctrl+Enter快速发送</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Delete,
  User,
  Promotion,
  ArrowDown,
  Plus,
} from "@element-plus/icons-vue";
import { sendChatMessage } from "@/api/aiChat";
import { getUserInfos } from "@/api/user";
import MarkdownIt from "markdown-it";

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

// 历史对话接口
interface ChatHistoryItem {
  id: number;
  title: string;
  time: string;
  active: boolean;
}

const messages = ref<Message[]>([]);
const userInput = ref("");
const isLoading = ref(false);
const messageArea = ref<HTMLElement | null>(null);
const userAvatar = ref<string>("");
const userScrolling = ref(false);
const showScrollButton = ref(false);
const isScrolling = ref(false); // 防止滚动过程中按钮闪烁

// 模拟的历史对话数据
const chatHistory = ref<ChatHistoryItem[]>([
  { id: 1, title: "Vue3组件开发", time: "今天 14:35", active: true },
  { id: 2, title: "CSS布局问题", time: "昨天 10:22", active: false },
  { id: 3, title: "React vs Vue", time: "3月15日", active: false },
  { id: 4, title: "TypeScript类型系统", time: "3月10日", active: false },
  { id: 5, title: "后端API设计", time: "3月5日", active: false },
]);

// 切换对话
const switchChat = (index: number) => {
  chatHistory.value.forEach((chat, idx) => {
    chat.active = idx === index;
  });
  // 这里可以添加加载对应对话内容的逻辑

  // 模拟切换对话，清空当前消息
  messages.value = [];

  // 添加模拟的初始消息
  messages.value.push({
    type: "ai",
    content: `您正在查看"${chatHistory.value[index].title}"的对话。请继续您的问题...`,
    time: getCurrentTime(),
  });

  // 滚动到底部
  scrollToBottom(true);
};

// 新建对话
const startNewChat = () => {
  // 重置所有active状态
  chatHistory.value.forEach((chat) => {
    chat.active = false;
  });

  // 添加新对话
  const newChat = {
    id: Date.now(),
    title: "新对话",
    time: getCurrentTime(),
    active: true,
  };

  // 添加到顶部
  chatHistory.value.unshift(newChat);

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
};

// 获取格式化的当前时间
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// 修改：滚动到底部的函数
const scrollToBottom = async (forceScroll = false) => {
  await nextTick();
  if (messageArea.value && (forceScroll || !userScrolling.value)) {
    isScrolling.value = true; // 标记正在滚动，防止按钮闪烁

    messageArea.value.scrollTop = messageArea.value.scrollHeight;

    // 滚动动画完成后重置标记
    setTimeout(() => {
      isScrolling.value = false;
    }, 300); // 300ms与CSS中的滚动动画时间匹配
  }
};

// 按钮点击事件：强制滚动到底部并启用自动滚动
const handleScrollToBottom = () => {
  userScrolling.value = false; // 重置滚动状态
  scrollToBottom(true); // 强制滚动到底部
  showScrollButton.value = false; // 隐藏按钮
};

// 处理用户滚动事件
const handleScroll = () => {
  if (!messageArea.value || isScrolling.value) return;

  // 检测是否到达底部
  const isAtBottom =
    Math.abs(
      messageArea.value.scrollHeight -
        messageArea.value.scrollTop -
        messageArea.value.clientHeight
    ) < 10;

  // 如果不在底部，显示滚动按钮
  if (!isAtBottom) {
    userScrolling.value = true;
    showScrollButton.value = true;
  } else {
    userScrolling.value = false;
    showScrollButton.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  // 添加用户消息
  messages.value.push({
    type: "user",
    content: userInput.value.trim(),
    time: getCurrentTime(),
  });

  const userMessage = userInput.value.trim();
  userInput.value = "";
  isLoading.value = true;

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
    await sendChatMessage(userMessage, (chunk) => {
      aiResponse += chunk;
      messages.value[aiMessageIndex].content = aiResponse;
      scrollToBottom();
    });

    // 如果是第一条消息，更新对话标题
    if (messages.value.length <= 3) {
      const activeChat = chatHistory.value.find((chat) => chat.active);
      if (activeChat && activeChat.title === "新对话") {
        activeChat.title =
          userMessage.length > 15
            ? userMessage.substring(0, 15) + "..."
            : userMessage;
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
  } finally {
    isLoading.value = false;
  }
};

// 清空对话
const clearMessages = () => {
  messages.value = [];
  messages.value.push({
    type: "ai",
    content: "对话已清空，有什么我可以帮助您的吗？",
    time: getCurrentTime(),
  });
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

// 组件挂载
onMounted(async () => {
  // 添加欢迎消息
  messages.value.push({
    type: "ai",
    content:
      "你好！我是爱丽丝，有什么可以帮助你的吗？\n\n你可以尝试向我提问，例如：\n\n* 前端开发技巧\n* 如何优化Vue应用\n* 解释一段代码",
    time: getCurrentTime(),
  });

  // 获取用户信息和头像
  await fetchUserInfo();

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
  height: 100vh;
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
  flex-direction: column;
  transition: all 0.2s ease;
}

.history-item:hover {
  background-color: #e6e8eb;
}

.history-item.active {
  background-color: #e6f7ff;
  border-left-color: #1890ff;
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
