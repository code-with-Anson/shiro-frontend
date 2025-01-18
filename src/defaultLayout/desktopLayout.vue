<template>
  <div v-if="isAuthenticated" class="routes">
    <RouterLink to="/">账单</RouterLink>
    <RouterLink to="/renew_bill">循环</RouterLink>
    <RouterLink to="/me">个人</RouterLink>
  </div>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useAuthStore } from "@/pinia/useAuthStore";

const isAuthenticated = useAuthStore().isAuthenticated;
</script>
