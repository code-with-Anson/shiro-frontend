<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 标题和Logo区域 -->
      <div class="header-area">
        <div class="app-logo">
          <img src="/favicon.ico" alt="汐落Logo" />
        </div>
        <h1 class="app-title">汐落</h1>
        <p class="app-subtitle">记录您的每一笔收支</p>
      </div>

      <!-- 表单区域 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        class="login-form"
        @submit.prevent="submitForm"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
          >
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          >
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="submitForm"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="action-links">
          <el-button link type="primary" @click="goToRegister">
            创建新账号
          </el-button>
          <el-button link type="info" @click="goToLost"> 忘记密码？ </el-button>
        </div>
      </el-form>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <p>© 2025 汐落记账应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/pinia/useAuthStore";
import { login } from "@/api/user";
import { ElMessage } from "element-plus";
import { Lock, Message } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

// 表单引用和数据
const loginFormRef = ref<FormInstance>();
const loginForm = ref({
  email: "",
  password: "",
});

// 表单校验规则
const rules = ref<FormRules>({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 15, message: "密码长度在6到15个字符之间", trigger: "blur" },
  ],
});

// 路由和状态
const router = useRouter();
const loading = ref(false);

// 路由跳转函数
const goToRegister = () => {
  router.push("/register");
};

const goToLost = () => {
  router.push("/lost");
};

// 提交表单
const submitForm = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;

    try {
      // 调用登录API
      await login(loginForm.value.email, loginForm.value.password);

      // 更新认证状态
      const authStore = useAuthStore();
      authStore.checkAuth();

      // 登录成功提示
      ElMessage({
        message: "登录成功",
        type: "success",
        customClass: "small-message",
        duration: 2000,
      });

      // 路由跳转到首页
      router.push("/");
    } catch (error: any) {
      // 错误处理
      console.error("登录失败:", error);
      ElMessage({
        message: `登录失败: ${error.message}`,
        type: "error",
        customClass: "small-message",
        duration: 3000,
      });
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  position: relative;
  padding: 0; /* 添加此行，确保没有内边距 */
  margin: 0; /* 确保没有外边距 */
  box-sizing: border-box; /* 确保边框和内边距包含在宽度内 */
  overflow: hidden; /* 避免产生滚动条 */
}

.login-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  width: 400px;
  padding: 40px;
  animation: fadeIn 0.5s ease;
}

.header-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.app-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(120deg, #52a1e5 0%, #39c5bb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 16px;
}

.app-logo img {
  width: 120%;
  height: 120%;
  object-fit: contain;
}

.app-title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  -webkit-background-clip: text;
  color: transparent;
  margin: 8px 0;
}

.app-subtitle {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.login-form {
  width: 100%;
}

.login-btn {
  height: 44px;
  font-size: 16px;
  width: 100%;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  border: none;
  margin: 8px 0;
  transition: all 0.3s ease;
}

.login-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.action-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.copyright {
  position: absolute;
  bottom: 20px;
  color: #666;
  font-size: 14px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 30px;
  }
}
</style>
