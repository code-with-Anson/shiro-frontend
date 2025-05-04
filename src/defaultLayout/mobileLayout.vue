<template>
  <div class="page">
    <router-view class="content" />
    <van-tabbar class="tabbar" v-if="isAuthenticated" v-model="active">
      <!-- 将"账单"指向常规账单管理页面 -->
      <van-tabbar-item
        to="/bill-management"
        name="bill-management"
        icon="gold-coin-o"
        >账单</van-tabbar-item
      >
      <van-tabbar-item to="/renew-bill" name="renew-bill" icon="gem-o"
        >循环</van-tabbar-item
      >
      <!-- 新增 AI 助手导航项 -->
      <van-tabbar-item to="/ai-chat-mobile" name="ai-chat-mobile" icon="chat-o"
        >AI助手</van-tabbar-item
      >
      <van-tabbar-item to="/me" name="me" icon="user-circle-o"
        >我的</van-tabbar-item
      >
    </van-tabbar>

    <footer class="footer"></footer>
  </div>
</template>

<script setup lang="ts">
import { useTabbar } from "@/utils/useTabbar";
import { useAuthStore } from "@/pinia/useAuthStore";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { ref, watchEffect, onMounted } from "vue";

const route = useRoute();
const { active } = useTabbar();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

// 根据当前路由路径更新底部导航栏状态
const updateActiveTab = () => {
  const path = route.path;

  // 路径与导航项映射
  if (path.startsWith("/bill-management")) {
    active.value = "bill-management";
  } else if (path.startsWith("/renew-bill")) {
    active.value = "renew-bill";
  } else if (path.startsWith("/ai-chat-mobile")) {
    active.value = "ai-chat-mobile";
  } else if (path.startsWith("/me")) {
    active.value = "me";
  }

  console.log("当前路径:", path, "激活标签:", active.value);
};

// 监听路由变化，更新导航栏状态
watchEffect(() => {
  if (isAuthenticated.value) {
    updateActiveTab();
  }
});

// 页面加载或刷新时，确保导航栏状态正确
onMounted(() => {
  updateActiveTab();
});
</script>

<style>
.tabbar {
  height: 3.125rem;
}
</style>
