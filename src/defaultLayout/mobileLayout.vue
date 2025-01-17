<template>
  <div class="page">
    <router-view class="content" />
    <van-tabbar v-model="active">
      <van-tabbar-item to="/" icon="gold-coin-o">账单</van-tabbar-item>
      <van-tabbar-item to="/renew_bill" icon="gem-o">循环</van-tabbar-item>
      <van-tabbar-item to="/me" icon="user-circle-o">我的</van-tabbar-item>
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
