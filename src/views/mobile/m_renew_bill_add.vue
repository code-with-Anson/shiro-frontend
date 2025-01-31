<template>
  <div>
    <!-- 顶部导航 -->
    <van-nav-bar
      title="添加循环账单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    <h1>这是循环账单添加页面</h1>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";

const router = useRouter();
// 返回上一页
const onClickLeft = () => {
  router.back();
};
</script>

<style></style>
