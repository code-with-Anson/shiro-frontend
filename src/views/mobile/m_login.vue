<template>
  <div class="m_login">
    <h1 style="font-size: 1.5rem; color: #52a1e5">汐落</h1>
    <van-form @submit="Login">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="emailRules"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="passwordRules"
        />
      </van-cell-group>
      <div
        style="
          margin: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        "
      >
        <van-button round block type="primary" native-type="submit">
          登录
        </van-button>
        <van-button round block plain type="primary" @click="goToRegister">
          注册
        </van-button>
        <van-button round block plain type="primary" @click="goToLost">
          忘记密码
        </van-button>
      </div>
    </van-form>
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
      message: "登录成功" + "\n",
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

<style>
.van-button {
  width: 12rem; /* 或者其他适合的宽度 */
}

.m_login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90vh; /* 使容器占据较大的视口高度 */
}
</style>
