<template>
  <div class="m_lost">
    <h1>移动端忘记密码页面</h1>
    <van-form @submit="sendEmail">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="请输入注册时的邮箱"
          :rules="emailRules"
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
          申请Token
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
import { emailRules } from "@/utils/validators";

const email = ref("");
const sendEmail = (values: { email: string }) => {
  console.log("提交" + values);
  console.log("提交的邮箱: " + values.email);
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

.m_lost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使容器占满整个视口高度 */
}
</style>
