<template>
  <div class="chat-container">
    <!-- 聊天头部保持不变 -->
    <div class="chat-header">
      <h2>爱丽丝chat</h2>
      <el-button
        type="primary"
        size="default"
        plain
        @click="clearMessages"
        :icon="Delete"
      >
        清空对话
      </el-button>
    </div>

    <div class="message-area" ref="messageArea">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.type]"
      >
        <div class="avatar-container">
          <!-- 使用用户真实头像或默认头像 -->
          <el-avatar
            :size="44"
            v-if="msg.type === 'user'"
            :src="userAvatar || ''"
            :icon="!userAvatar ? User : undefined"
          />
          <!-- AI头像使用public文件夹中的alice图片 -->
          <el-avatar :size="44" v-else :src="'/alice.jpg'" />
        </div>
        <div class="message-content">
          <div class="message-text">
            <!-- 如果是AI消息且内容为空，显示加载动画 -->
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
              <!-- 用户消息直接显示文本 -->
              <template v-if="msg.type === 'user' || msg.type === 'system'">
                {{ msg.content }}
              </template>
              <!-- AI消息使用markdown解析 -->
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
    </div>

    <!-- 输入区域保持不变 -->
    <div class="input-area">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="4"
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
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { ElMessage } from "element-plus";
import { Delete, User, Promotion } from "@element-plus/icons-vue";
import { sendChatMessage } from "@/api/aiChat";
import { getUserInfos } from "@/api/user"; // 导入获取用户信息的API
import MarkdownIt from "markdown-it"; // 导入markdown-it

// 创建markdown-it实例并配置
const md = new MarkdownIt({
  html: true, // 允许HTML标签
  breaks: true, // 将\n转换为<br>
  linkify: true, // 自动将URL转换为链接
  typographer: true, // 启用一些语言中立的替换和引号美化
  highlight: function (str, lang) {
    // 可以在这里添加代码高亮逻辑
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
const isLoading = ref(false);
const messageArea = ref<HTMLElement | null>(null);
const userAvatar = ref<string>(""); // 用户头像URL

// 获取格式化的当前时间
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messageArea.value) {
    messageArea.value.scrollTop = messageArea.value.scrollHeight;
  }
};

watch(messages, scrollToBottom, { deep: true });

// 清空对话
const clearMessages = () => {
  messages.value = [
    {
      type: "ai",
      content:
        "你好！我是爱丽丝，有什么可以帮助你的吗？\n\n你可以尝试向我提问，例如：\n\n* 前端开发技巧\n* 如何优化Vue应用\n* 解释一段代码",
      time: getCurrentTime(),
    },
  ];
};

// 发送消息并处理流式响应
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

// 加载初始欢迎消息和获取用户信息
onMounted(async () => {
  // 添加欢迎消息，包含一些Markdown格式内容
  messages.value.push({
    type: "ai",
    content:
      "你好！我是爱丽丝，有什么可以帮助你的吗？\n\n你可以尝试向我提问，例如：\n\n* 前端开发技巧\n* 如何优化Vue应用\n* 解释一段代码",
    time: getCurrentTime(),
  });

  // 获取用户信息和头像
  await fetchUserInfo();
});
</script>

<style scoped>
/* 保留原有样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  max-width: 1200px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.chat-header {
  padding: 20px 28px;
  background: linear-gradient(120deg, #52a1e5 0%, #39c5bb 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
}

.chat-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.chat-header .el-button {
  font-size: 15px;
  padding: 9px 16px;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  background-color: #f9fafc;
}

.message {
  margin-bottom: 26px;
  display: flex;
  gap: 16px;
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
  padding: 16px 20px;
  border-radius: 16px;
  word-break: break-word;
  line-height: 1.6;
  font-size: 16px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
}

.message-time {
  margin-top: 6px;
  font-size: 13px;
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

.input-area {
  display: flex;
  gap: 16px;
  padding: 24px 28px;
  background-color: #ffffff;
  border-top: 1px solid #eaeaea;
  align-items: flex-start;
}

.input-area .el-input {
  flex: 1;
}

.input-area .el-input :deep(.el-textarea__inner) {
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
  padding-bottom: 14px;
  color: #999;
  font-size: 14px;
}

.loading-container {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.loading-dot {
  width: 10px;
  height: 10px;
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

@media (max-width: 1400px) {
  .chat-container {
    max-width: 1000px;
  }

  .message-content {
    max-width: 700px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 100px);
    border-radius: 0;
    max-width: 100%;
  }

  .message-area {
    padding: 20px;
  }

  .message-content {
    max-width: 75%;
  }

  .chat-header {
    padding: 16px 20px;
  }

  .chat-header h2 {
    font-size: 20px;
  }

  .input-area {
    padding: 16px 20px;
  }
}

/* 添加Markdown样式 */
.markdown-body {
  line-height: 1.6;
  word-break: break-word;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 1.5em;
  margin-top: 0;
}

.markdown-body h2 {
  font-size: 1.3em;
}

.markdown-body h3 {
  font-size: 1.1em;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body pre {
  margin: 16px 0;
  padding: 12px 16px;
  overflow: auto;
  background-color: #f6f8fa;
  border-radius: 6px;
}

.markdown-body code {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  padding: 2px 4px;
  font-size: 0.9em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body pre code {
  padding: 0;
  background-color: transparent;
  white-space: pre;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding: 0 16px;
  margin-left: 0;
  margin-right: 0;
}

.markdown-body table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table th {
  background-color: #f6f8fa;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body img {
  max-width: 100%;
  box-sizing: border-box;
}

/* 确保AI消息中的markdown内容显示正确 */
.ai .message-text .markdown-body {
  color: #333;
}
</style>
