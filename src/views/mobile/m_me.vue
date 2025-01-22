<template>
  <div class="m_me">
    <van-image
      round
      fit="cover"
      width="10rem"
      height="10rem"
      :src="user.avatar"
    />
    <van-cell-group inset class="userDetails">
      <van-cell title="邮箱" :value="user.email" class="email-cell" />
      <van-cell title="昵称" :value="user.name" />
      <van-cell title="性别" :value="user.sex" />
    </van-cell-group>
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

<script setup lang="ts">
import { logout } from "@/api/user";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import "vant/lib/index.css";
import { onMounted, ref } from "vue";

// 数据结构定义部分：
const user = ref({
  avatar: "",
  email: "",
  name: "",
  sex: "",
  token: "",
  userId: "",
});

// 路由跳转
const router = useRouter();

// 退出登录
const Logout = () => {
  logout();
  showSuccessToast("退出登录成功");
  router.push("/login");
};

onMounted(() => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    user.value = JSON.parse(userStr);
    console.log("当前的用户昵称是" + user.value.name);
    console.log("当前的用户头像是" + user.value.avatar);
  }
});
</script>

<style scoped>
.van-button {
  width: 15rem; /* 或者其他适合的宽度 */
}

.m_me {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使容器占满整个视口高度 */
}

.userDetails {
  width: 20rem;
}

.email-cell :deep(.van-cell__value) {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
