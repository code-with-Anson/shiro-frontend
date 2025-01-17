<template>
  <div id="app">
    <desktopLayout v-if="!isMobile" />
    <mobileLayout v-else />
  </div>
</template>

<script setup lang="ts">
import { useDeviceStore } from "./pinia/deviceStore";
import desktopLayout from "./defaultLayout/desktopLayout.vue";
import mobileLayout from "./defaultLayout/mobileLayout.vue";

//检测是否为移动设备
const isMobile = useDeviceStore().isMobile;
</script>
