<template>
  <!-- 顶部导航 -->
  <van-nav-bar title="日常" right-text="🔍" />

  <!-- Sticky 固定顶部 -->
  <van-sticky>
    <van-cell
      title="1月支出"
      value="￥883.10"
      label="本月收入 0.00"
      value-class="highlight"
    />
  </van-sticky>

  <!-- 记录列表 -->
  <van-cell-group>
    <van-cell
      v-for="item in bills"
      :key="item.date + item.category"
      :title="item.category"
      :label="item.date"
      :value="`支出: ￥${item.amount}`"
      :icon="item.icon"
      is-link
    />
  </van-cell-group>
</template>

<script setup lang="ts">
import { ref } from "vue";

const bills = ref([
  { category: "餐饮", amount: 100, date: "2021-01-01", icon: "smile-o" },
  { category: "交通", amount: 200, date: "2021-01-02", icon: "smile-o" },
  { category: "购物", amount: 300, date: "2021-01-03", icon: "smile-o" },
  // 其他数据省略
]);
</script>

<style scoped>
::v-deep(.van-cell__value.highlight) {
  color: #08979c;
  font-weight: bold;
}
</style>
