<template>
  <div class="m_login">
    <h1>移动端用户登录页面</h1>
    <van-form @submit="onSubmit">
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
        <van-button round block plain type="info" @click="goToLost">
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
import { emailRules, passwordRules } from "@/utils/validators";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const onSubmit = (values: { email: string; password: string }) => {
  console.log("提交" + values);
  console.log("提交的邮箱: " + values.email);
  console.log("提交的密码: " + values.password);
};

const router = useRouter();
const goToRegister = () => {
  router.push("/register");
};
const goToLost = () => {
  router.push("/lost");
};
</script>
