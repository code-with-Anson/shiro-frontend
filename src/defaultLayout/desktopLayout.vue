<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <RouterLink to="/">账单</RouterLink>
  <RouterLink to="/renew_bill">循环</RouterLink>
  <RouterLink to="/me">个人</RouterLink>
  <RouterView />
</template>
