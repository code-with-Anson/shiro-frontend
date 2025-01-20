<template>
  <div class="m_register">
    <h1>移动端用户注册页面</h1>
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
          margin: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        "
      >
        <van-button round block type="primary" native-type="goToLogin">
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
import { showSuccessToast, showFailToast } from "vant";

const username = ref("");
const email = ref("");
const password = ref("");
const registerUser = async (values: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    console.log("提交" + values);
    console.log("提交的昵称: " + values.username);
    console.log("提交的邮箱: " + values.email);
    console.log("提交的密码: " + values.password);
    const result = await register(
      values.username,
      values.email,
      values.password
    );
    console.log(result);
    showSuccessToast("注册成功");
    router.push("/login");
  } catch (error: any) {
    // 错误处理
    console.error("注册失败:", error);
    showFailToast({
      message: "注册失败" + "\n" + error.message,
      position: "middle",
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
  width: 15rem; /* 或者其他适合的宽度 */
}

.m_register {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使容器占满整个视口高度 */
}
</style>
