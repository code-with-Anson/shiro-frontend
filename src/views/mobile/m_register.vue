<template>
  <div class="register-container">
    <div class="register-card">
      <!-- 标题部分 -->
      <div class="logo-area">
        <div class="app-logo">
          <img src="/favicon.ico" alt="汐落Logo" />
        </div>
        <h1 class="app-title">汐落</h1>
        <p class="app-subtitle">创建您的记账账户</p>
      </div>

      <!-- 表单部分 -->
      <van-form @submit="handleRegister" class="register-form">
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
            v-model="name"
            name="name"
            label="昵称"
            left-icon="friends-o"
            placeholder="请输入昵称"
            :rules="usernameRules"
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
          <van-field
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            left-icon="lock"
            placeholder="请再次输入密码"
            :rules="confirmPasswordRules"
          />
        </van-cell-group>

        <!-- 按钮区域 -->
        <div class="button-group">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            class="register-btn"
          >
            注册账号
          </van-button>
          <van-button
            round
            block
            plain
            type="primary"
            @click="goToLogin"
            class="login-btn"
          >
            返回登录
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 页脚区域 -->
    <div class="register-footer">
      <p>© 2025 汐落记账应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { emailRules, passwordRules, usernameRules } from "@/utils/validators";
import { register as registerApi } from "@/api/user";
import { ElMessage } from "element-plus";

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

// 自定义确认密码验证规则
const validateConfirmPassword = () => {
  return password.value === confirmPassword.value;
};

const confirmPasswordRules = [
  { required: true, message: "请确认密码" },
  { validator: validateConfirmPassword, message: "两次输入的密码不一致" },
  {
    validator: (value: string) => value.length >= 6 && value.length <= 15,
    message: "密码在6到15位之间",
  },
];

const handleRegister = async (values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  try {
    if (values.password !== values.confirmPassword) {
      ElMessage({
        message: "两次输入的密码不一致",
        type: "error",
        plain: true,
      });
      return;
    }
    // 1.发送注册请求
    const result = await registerApi(
      values.name,
      values.email,
      values.password
    );
    console.log(result);
    // 2.进行友好提示

    ElMessage({
      message: "注册成功",
      type: "success",
      plain: true,
    });
    // 3.路由跳转
    router.push("/login");
  } catch (error: any) {
    // 错误处理
    console.error("注册失败:", error);
    ElMessage({
      message: "注册失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

const router = useRouter();
const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register-container {
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

.register-card {
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
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.app-title {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  -webkit-background-clip: text;
  color: transparent;
  margin: 0.5rem 0;
}

.app-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.register-form {
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
  max-width: 350px; /* 控制最大宽度 */
}

:deep(.van-field) {
  padding: 12px 16px;
}

/* 修正字段内部对齐 */
:deep(.van-field__left-icon) {
  margin-right: 10px;
}

:deep(.van-field__control) {
  text-align: left;
}

:deep(.van-cell__title) {
  width: 4rem; /* 统一标签宽度 */
  flex: none;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 350px; /* 与输入框保持一致 */
}

.register-btn {
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  border: none;
  width: 100% !important;
  box-sizing: border-box;
}

.login-btn {
  font-size: 0.85rem;
  border-color: #52a1e5;
  color: #52a1e5;
  width: 100% !important;
  box-sizing: border-box;
}

:deep(.van-button) {
  width: 100% !important;
}

.register-footer {
  text-align: center;
  color: #666;
  font-size: 0.8rem;
  margin-top: auto;
  width: 100%;
}

/* 响应式调整 */
@media (max-height: 600px) {
  .register-container {
    padding: 1rem;
  }

  .register-card {
    padding: 1.5rem 1rem;
  }

  .app-logo {
    width: 60px;
    height: 60px;
  }
}
</style>
