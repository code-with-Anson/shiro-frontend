<template>
  <div class="register-page">
    <div class="register-card">
      <!-- 标题和Logo区域 -->
      <div class="header-area">
        <div class="app-logo">
          <img src="/favicon.ico" alt="汐落Logo" />
        </div>
        <h1 class="app-title">汐落</h1>
        <p class="app-subtitle">创建您的记账账户</p>
      </div>

      <!-- 表单区域 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-width="0"
        class="register-form"
        @submit.prevent="submitForm"
      >
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
          >
          </el-input>
        </el-form-item>

        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入昵称"
            prefix-icon="User"
          >
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          >
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          >
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="submitForm"
          >
            注册账号
          </el-button>
        </el-form-item>

        <div class="action-links">
          <el-button link type="primary" @click="goToLogin">
            已有账号？立即登录
          </el-button>
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
import { register as registerApi } from "@/api/user";
import { ElMessage } from "element-plus";
import { Lock, Message, User } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

// 表单引用和数据
const registerFormRef = ref<FormInstance>();
const registerForm = ref({
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
});

// 自定义验证函数 - 确认密码
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === "") {
    callback(new Error("请再次输入密码"));
  } else if (value !== registerForm.value.password) {
    callback(new Error("两次输入密码不一致"));
  } else {
    callback();
  }
};

// 表单校验规则
const rules = ref<FormRules>({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  name: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 1, max: 10, message: "昵称长度在1到10个字符之间", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 15, message: "密码长度在6到15个字符之间", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
});

// 路由和状态
const router = useRouter();
const loading = ref(false);

// 路由跳转函数
const goToLogin = () => {
  router.push("/login");
};

// 提交表单
const submitForm = () => {
  registerFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;

    try {
      // 调用注册API
      await registerApi(
        registerForm.value.name,
        registerForm.value.email,
        registerForm.value.password
      );

      // 注册成功提示
      ElMessage({
        message: "注册成功，请登录",
        type: "success",
        customClass: "small-message",
        duration: 2000,
      });

      // 跳转到登录页
      router.push("/login");
    } catch (error: any) {
      // 错误处理
      console.error("注册失败:", error);
      ElMessage({
        message: `注册失败: ${error.message}`,
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
.register-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  position: relative;
  padding: 40px 0; /* 添加上下内边距 */
  box-sizing: border-box; /* 确保内边距包含在高度内 */
}

.register-card {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  width: 400px;
  padding: 30px; /* 减小内边距 */
  animation: fadeIn 0.5s ease;
  max-height: calc(100vh - 120px); /* 限制最大高度 */
  overflow-y: auto; /* 内容过多时允许滚动 */
  margin-bottom: 70px; /* 为底部版权信息留出空间 */
}

.header-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
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

.register-form {
  width: 100%;
}

.register-btn {
  height: 44px;
  font-size: 16px;
  width: 100%;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  border: none;
  margin: 8px 0;
  transition: all 0.3s ease;
}

.register-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.action-links {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.copyright {
  position: absolute;
  bottom: 20px;
  color: #666;
  font-size: 14px;
  text-align: center;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 1; /* 确保版权信息在顶层 */
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
  .register-card {
    width: 90%;
    padding: 20px; /* 在小屏幕上进一步减小内边距 */
  }

  .app-logo {
    width: 60px; /* 减小logo大小 */
    height: 60px;
  }

  .app-title {
    font-size: 24px; /* 减小标题大小 */
  }

  /* 确保在小屏幕上有足够间距 */
  .register-page {
    padding: 20px 0;
  }
}

/* 极小屏幕适配 */
@media (max-height: 600px) {
  .register-card {
    padding: 15px;
    margin-bottom: 50px;
  }

  .header-area {
    margin-bottom: 15px;
  }

  .app-logo {
    width: 50px;
    height: 50px;
    margin-bottom: 10px;
  }

  .copyright {
    bottom: 10px;
    font-size: 12px;
  }
}
</style>
