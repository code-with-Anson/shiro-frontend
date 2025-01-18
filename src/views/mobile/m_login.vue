<template>
  <div class="m_login">
    <h1>移动端用户登录页面</h1>
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
          margin: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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

<style>
.van-button {
  width: 15rem; /* 或者其他适合的宽度 */
}

.m_login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使容器占满整个视口高度 */
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/pinia/useAuthStore";
import { emailRules, passwordRules } from "@/utils/validators";
import { useRouter } from "vue-router";
import { login } from "@/api/user";

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
    // 打印登录信息
    console.log("提交", values);
    console.log("提交的邮箱:", values.email);
    console.log("提交的密码:", values.password);

    // 等待登录完成
    await login(values.email, values.password);

    // 确认 token 已经存在
    const token = localStorage.getItem("token");
    console.log("token:", token);
    if (!token) {
      throw new Error("登录失败：未获取到 token");
    }
    const authStore = useAuthStore();
    authStore.setAuthState(true);
    // 登录成功，进行路由跳转
    router.push("/");
    window.location.reload();
  } catch (error) {
    // 错误处理
    console.error("登录失败:", error);
    // 这里可以添加错误提示，比如使用 message 组件
    // message.error("登录失败，请重试");
  }
};
</script>
