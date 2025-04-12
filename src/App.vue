<template>
  <div id="app">
    <desktopLayout v-if="!isMobile" />
    <mobileLayout v-else />
  </div>
</template>

<script setup lang="ts">
import { useDeviceStore } from "./pinia/deviceStore";
import desktopLayout from "@/defaultLayout/desktopLayout.vue";
import mobileLayout from "@/defaultLayout/mobileLayout.vue";

//检测是否为移动设备
const isMobile = useDeviceStore().isMobile;
</script>

<style>
/* 定义全局小消息样式
适用于所有页面 */
.small-message {
  font-size: 14px !important; /* 修改为 14px */
  min-width: 200px !important;
  padding: 8px 12px !important;
}

.small-message .el-message__content {
  font-size: 14px !important; /* 修改为 14px */
}

.small-message .el-message__icon {
  font-size: 14px !important; /* 修改为 14px */
}

/* 添加Element Plus普通消息样式 */
.el-message {
  font-size: 14px !important; /* 修改为 14px */
}

.el-message .el-message__content {
  font-size: 14px !important; /* 修改为 14px */
}

.el-message .el-message__icon {
  font-size: 14px !important; /* 修改为 14px */
}

/* Vant Toast消息样式 */
:root {
  --van-toast-font-size: 14px !important; /* 修改为 14px */
  --van-toast-text-font-size: 14px !important; /* 修改为 14px */
}

.van-toast {
  font-size: 14px !important; /* 修改为 14px */
}

/* Element Plus确认对话框样式 */
.el-message-box__message {
  font-size: 14px !important; /* 修改为 14px */
}

.el-message-box__title {
  font-size: 16px !important; /* 适当调整为 16px */
}

/* Vant Dialog样式 */
.van-dialog__message {
  font-size: 14px !important; /* 修改为 14px */
}

.van-dialog__header {
  font-size: 16px !important; /* 适当调整为 16px */
}
</style>
