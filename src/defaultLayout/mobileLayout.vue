<template>
  <div class="page">
    <router-view class="content" />
    <van-tabbar class="tabbar" v-if="isAuthenticated" v-model="active">
      <!-- 将"账单"指向常规账单管理页面 -->
      <van-tabbar-item to="/bill-management" icon="gold-coin-o"
        >账单</van-tabbar-item
      >
      <van-tabbar-item to="/renew-bill" icon="gem-o">循环</van-tabbar-item>
      <van-tabbar-item to="/me" icon="user-circle-o">我的</van-tabbar-item>
    </van-tabbar>

    <footer class="footer"></footer>
  </div>
</template>

<script setup lang="ts">
import { useTabbar } from "@/utils/useTabbar";
import { useAuthStore } from "@/pinia/useAuthStore";
import { storeToRefs } from "pinia";

const { active } = useTabbar();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
</script>

<style>
.tabbar {
  height: 3.125rem;
}
</style>
