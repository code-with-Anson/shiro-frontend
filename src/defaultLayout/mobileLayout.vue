<template>
  <div class="page">
    <router-view class="content" />
    <van-tabbar v-model="active">
      <van-tabbar-item to="/" icon="home-o">账单</van-tabbar-item>
      <van-tabbar-item to="/renew_bill" icon="search">循环</van-tabbar-item>
      <van-tabbar-item to="/me" icon="friends-o">我的</van-tabbar-item>
    </van-tabbar>

    <footer class="footer"></footer>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  setup() {
    const active = ref(0);
    return { active };
  },
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 让页面高度充满视口 */
}

.content {
  flex: 1; /* 让内容区域自动填充剩余空间 */
}

.footer {
  flex-shrink: 0; /* 确保 footer 不被压缩 */
}
</style>
