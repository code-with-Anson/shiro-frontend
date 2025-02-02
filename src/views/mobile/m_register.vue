<template>
  <div class="m_register">
    <h1 style="font-size: 1.5rem; color: #39c5bb">注册</h1>
    <van-form @submit="registerUser">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="昵称"
          placeholder="你的称呼是？"
          :rules="usernameRules"
        />
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="邮箱是登录凭证"
          :rules="emailRules"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请认真记住"
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
          注册
        </van-button>
        <van-button round block plain type="primary" @click="goToLogin">
          返回登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { emailRules, passwordRules, usernameRules } from "@/utils/validators";
import { register } from "@/api/user";
import { ElMessage } from "element-plus";

const username = ref("");
const email = ref("");
const password = ref("");
const registerUser = async (values: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    // 1.发送注册请求
    const result = await register(
      values.username,
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

<style>
.van-button {
  width: 12rem; /* 或者其他适合的宽度 */
}

.m_register {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90vh; /* 使容器占据较大的视口高度 */
}
</style>
