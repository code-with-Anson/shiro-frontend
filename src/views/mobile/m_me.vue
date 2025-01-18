<template>
  <div class="m_login">
    <h1>移动端个人信息页面</h1>
    <van-form @submit="Logout">
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
          退出登录
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
import { logout } from "@/api/user";
import { useRouter } from "vue-router";

// 路由跳转
const router = useRouter();

// 退出登录
const Logout = () => {
  logout();
  router.push("/login");
};
</script>
