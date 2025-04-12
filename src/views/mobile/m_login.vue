<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 标题部分 -->
      <div class="logo-area">
        <div class="app-logo">
          <img src="/favicon.ico" alt="汐落Logo" />
        </div>
        <h1 class="app-title">汐落</h1>
        <p class="app-subtitle">记录您的每一笔收支</p>
      </div>

      <!-- 表单部分 -->
      <van-form @submit="Login" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="email"
            name="email"
            label="邮箱"
            left-icon="envelop-o"
            placeholder="请输入邮箱"
            :rules="emailRules"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            left-icon="lock"
            placeholder="请输入密码"
            :rules="passwordRules"
          />
        </van-cell-group>

        <!-- 按钮区域 -->
        <div class="button-group">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            class="login-btn"
          >
            登录
          </van-button>
          <div class="action-links">
            <van-button
              round
              block
              plain
              type="primary"
              @click="goToRegister"
              class="register-btn"
            >
              注册账号
            </van-button>
            <van-button round block plain @click="goToLost" class="forgot-btn">
              忘记密码
            </van-button>
          </div>
        </div>
      </van-form>
    </div>

    <!-- 页脚区域 -->
    <div class="login-footer">
      <p>© 2025 汐落记账应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/pinia/useAuthStore";
import { emailRules, passwordRules } from "@/utils/validators";
import { useRouter } from "vue-router";
import { login } from "@/api/user";
import { ElMessage } from "element-plus";

// 数据定义
const email = ref("");
const password = ref("");

// 路由跳转
const router = useRouter();
const goToRegister = () => {
  router.push("/register");
};
const goToLost = () => {
  router.push("/lost");
};

// 提交表单
const Login = async (values: { email: string; password: string }) => {
  try {
    // 1. 先进行登录
    const loginData = await login(values.email, values.password);
    // 登录成功提示
    ElMessage({
      message: "登录成功",
      type: "success",
      plain: true,
    });
    // 2. 设置认证状态
    const authStore = useAuthStore();
    authStore.checkAuth();
    // 3. 路由跳转
    router.push("/");
  } catch (error: any) {
    // 错误处理
    console.error("登录失败:", error);
    ElMessage({
      message: "登录失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  box-sizing: border-box;
  position: relative;
  width: 100%;
}

.login-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  padding: 2rem 1.5rem;
  margin-bottom: 2rem;
  box-sizing: border-box;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.app-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(120deg, #52a1e5 0%, #39c5bb 100%);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.app-logo img {
  width: 120%;
  height: 120%;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.app-title {
  font-size: 24px; /* 原来是 2rem */
  font-weight: bold;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  -webkit-background-clip: text;
  color: transparent;
  margin: 0.5rem 0;
}

.app-subtitle {
  color: #666;
  font-size: 14px; /* 原来是 0.9rem */
  margin-top: 0.5rem;
}

.login-form {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.van-cell-group) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 0.8rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 350px;
}

:deep(.van-field) {
  padding: 12px 16px;
}

:deep(.van-field__left-icon) {
  margin-right: 10px;
}

:deep(.van-field__control) {
  text-align: left;
}

:deep(.van-cell__title) {
  width: 4rem;
  flex: none;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 350px;
}

.login-btn {
  height: 3rem;
  font-size: 16px; /* 原来是 1rem */
  font-weight: 600;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  border: none;
  width: 100% !important;
  box-sizing: border-box;
}

.action-links {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.register-btn,
.forgot-btn {
  flex: 1;
  font-size: 14px; /* 原来是 0.85rem */
  border-color: #52a1e5;
  color: #52a1e5;
  width: 100% !important;
  box-sizing: border-box;
}

:deep(.van-button) {
  width: 100% !important;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 12px; /* 原来是 0.8rem */
  margin-top: auto;
  width: 100%;
}

/* 响应式调整 */
@media (max-height: 600px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 1.5rem 1rem;
  }

  .app-logo {
    width: 60px;
    height: 60px;
  }
}
</style>
