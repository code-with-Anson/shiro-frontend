<template>
  <div class="page">
    <router-view class="content" />
    <van-tabbar v-if="isAuthenticated" v-model="active">
      <van-tabbar-item to="/" icon="gold-coin-o">账单</van-tabbar-item>
      <van-tabbar-item to="/renew_bill" icon="gem-o">循环</van-tabbar-item>
      <van-tabbar-item to="/me" icon="user-circle-o">我的</van-tabbar-item>
    </van-tabbar>

    <footer class="footer"></footer>
  </div>
</template>

<script setup lang="ts">
import { useTabbar } from "@/utils/useTabbar";
import { useAuthStore } from "@/pinia/useAuthStore";
import { onMounted } from "vue";

const { active } = useTabbar();
const isAuthenticated = useAuthStore().isAuthenticated;

// onMounted(() => {
//   console.log("当前的登录状态: " + isAuthenticated);
// });
</script>
