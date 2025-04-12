<template>
  <div class="lost-page">
    <div class="lost-card">
      <!-- 标题和Logo区域 -->
      <div class="header-area">
        <div class="app-logo">
          <img src="/favicon.ico" alt="汐落Logo" />
        </div>
        <h1 class="app-title">汐落</h1>
        <p class="app-subtitle">找回您的账号密码</p>
      </div>

      <!-- 表单区域 -->
      <el-form
        v-if="!isEmailSent"
        ref="emailFormRef"
        :model="formData"
        :rules="emailRules"
        label-width="0"
        class="lost-form"
        @submit.prevent="sendEmail"
      >
        <el-form-item prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入注册时的邮箱"
            prefix-icon="Message"
          >
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="sendEmail"
          >
            发送验证码
          </el-button>
        </el-form-item>

        <div class="action-links">
          <el-button link type="primary" @click="goToLogin">
            返回登录
          </el-button>
        </div>
      </el-form>

      <!-- 验证码表单 -->
      <el-form
        v-else
        ref="codeFormRef"
        :model="formData"
        :rules="codeRules"
        label-width="0"
        class="lost-form"
        @submit.prevent="verify"
      >
        <el-form-item prop="email">
          <el-input
            v-model="formData.email"
            disabled
            placeholder="邮箱地址"
            prefix-icon="Message"
          >
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入验证码"
            prefix-icon="Key"
          >
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="verify"
          >
            验证并登录
          </el-button>
        </el-form-item>

        <div class="action-links">
          <el-button link type="primary" @click="isEmailSent = false">
            重新发送验证码
          </el-button>
          <el-button link type="info" @click="goToLogin"> 返回登录 </el-button>
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
import { forgetPassword, verifyAndLogin } from "@/api/user";
import { ElMessage } from "element-plus";
import { Message, Key } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

// 表单引用和数据
const emailFormRef = ref<FormInstance>();
const codeFormRef = ref<FormInstance>();
const formData = ref({
  email: "",
  code: "",
});

// 状态
const loading = ref(false);
const isEmailSent = ref(false);

// 表单校验规则
const emailRules = ref<FormRules>({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
});

const codeRules = ref<FormRules>({
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 6, max: 6, message: "验证码长度为6位", trigger: "blur" },
  ],
});

// 路由和状态
const router = useRouter();

// 路由跳转函数
const goToLogin = () => {
  router.push("/login");
};

// 发送验证码
const sendEmail = async () => {
  await emailFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;

    try {
      const result = await forgetPassword(formData.value.email);

      ElMessage({
        message: "验证码已发送到您的邮箱",
        type: "success",
        customClass: "small-message",
        duration: 2000,
      });

      isEmailSent.value = true;
    } catch (error: any) {
      ElMessage({
        message: `发送失败: ${error.message}`,
        type: "error",
        customClass: "small-message",
        duration: 3000,
      });
      console.error("发送验证码失败:", error);
    } finally {
      loading.value = false;
    }
  });
};

// 验证并登录
const verify = async () => {
  await codeFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;

    try {
      // 验证并登录
      await verifyAndLogin(formData.value.code, formData.value.email);

      // 更新认证状态
      const authStore = useAuthStore();
      authStore.checkAuth();

      ElMessage({
        message: "验证成功，已自动登录",
        type: "success",
        customClass: "small-message",
        duration: 2000,
      });

      // 跳转到首页
      router.push("/");
    } catch (error: any) {
      ElMessage({
        message: `验证失败: ${error.message}`,
        type: "error",
        customClass: "small-message",
        duration: 3000,
      });
      console.error("验证失败:", error);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.lost-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  position: relative;
}

.lost-card {
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

.lost-form {
  width: 100%;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  width: 100%;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  border: none;
  margin: 8px 0;
  transition: all 0.3s ease;
}

.submit-btn:hover {
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
  .lost-card {
    width: 90%;
    padding: 30px;
  }
}
</style>
