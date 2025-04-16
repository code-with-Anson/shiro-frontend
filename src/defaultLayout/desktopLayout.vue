<template>
  <div class="app-container">
    <!-- 顶部导航栏 - 仅在用户登录后显示 -->
    <el-header v-if="isAuthenticated" class="main-header">
      <div class="header-container">
        <div class="logo-area">
          <img src="/favicon.ico" alt="汐落Logo" class="app-logo" />
          <h1 class="app-name">汐落记账</h1>
        </div>

        <div class="nav-container">
          <!-- 替换el-menu为自定义导航 -->
          <div class="custom-nav">
            <router-link
              to="/"
              class="nav-item"
              :class="{ active: activeRoute === '/' }"
            >
              <el-icon><data-analysis /></el-icon>
              <span>账单统计</span>
            </router-link>
            <router-link
              to="/bill-management"
              class="nav-item"
              :class="{ active: activeRoute === '/bill-management' }"
            >
              <el-icon><document /></el-icon>
              <span>我的账单</span>
            </router-link>
            <router-link
              to="/renew_bill"
              class="nav-item"
              :class="{ active: activeRoute === '/renew_bill' }"
            >
              <el-icon><refresh-right /></el-icon>
              <span>循环账单</span>
            </router-link>
            <router-link
              to="/me"
              class="nav-item"
              :class="{ active: activeRoute === '/me' }"
            >
              <el-icon><user /></el-icon>
              <span>个人中心</span>
            </router-link>
          </div>
        </div>

        <!-- 添加右侧占位符以平衡布局 -->
        <div class="placeholder-area"></div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main :class="{ 'with-header': isAuthenticated }" class="main-content">
      <RouterView />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/pinia/useAuthStore";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  Document,
  RefreshRight,
  User,
  DataAnalysis,
} from "@element-plus/icons-vue";

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const route = useRoute();
const router = useRouter();

// 跟踪当前活动路由
const activeRoute = computed(() => route.path);

// 检查认证状态
onMounted(() => {
  if (!isAuthenticated.value) {
    // 如果用户访问需要认证的页面但未登录，重定向到登录页
    const publicPages = ["/login", "/register", "/lost"];
    if (!publicPages.includes(route.path)) {
      router.push("/login");
    }
  }
});

// 监听路由变化，确保未登录用户无法访问需要认证的页面
watch(
  () => route.path,
  (newPath) => {
    const publicPages = ["/login", "/register", "/lost"];
    if (!publicPages.includes(newPath) && !isAuthenticated.value) {
      router.push("/login");
    }
  }
);
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  position: fixed;
  width: 100%;
  z-index: 1000;
  padding: 0;
  height: 60px;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 改为 space-between */
  height: 100%;
  padding: 0 20px;
  position: relative;
}

.logo-area {
  display: flex;
  align-items: center;
  width: 150px; /* 设置固定宽度 */
}

.app-logo {
  height: 32px;
  width: 32px;
  margin-right: 10px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #52a1e5, #39c5bb);
  -webkit-background-clip: text;
  color: transparent;
  margin: 0;
}

/* 替换main-nav为自定义导航样式 */
.nav-container {
  /* flex: 1;  移除 flex: 1 */
  display: flex;
  justify-content: center; /* 保持内部居中 */
}

.custom-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
}

.nav-item {
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  font-size: 15px;
  color: #333333;
  display: flex;
  align-items: center;
  text-decoration: none;
  position: relative;
  transition: color 0.3s;
}

.nav-item:hover {
  color: #39c5bb;
}

.nav-item.active {
  color: #39c5bb;
}

.nav-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #39c5bb;
}

.nav-item .el-icon {
  margin-right: 5px;
  font-size: 18px;
}

/* 移除user-actions相关样式，导航会自然居中 */

.placeholder-area {
  width: 150px; /* 与 logo-area 等宽 */
  height: 1px; /* 确保它不影响高度 */
}

.main-content {
  padding: 0 !important; /* 强制覆盖，从20px改为0 */
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  width: 100%;
  margin: 0;
  box-sizing: border-box;
}

/* 只有登录后的页面需要padding */
.main-content.with-header {
  margin-top: 60px;
  padding: 20px !important; /* 登录后的页面才有padding */
}

/* 特别针对登录、注册和找回密码页面 */
:deep(.login-page),
:deep(.register-page),
:deep(.lost-page) {
  padding: 0 !important;
  margin: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
}

/* 媒体查询 - 响应式调整 */
@media (max-width: 768px) {
  .app-name {
    display: none;
  }

  .logo-area {
    width: 40px; /* 调整宽度 */
  }

  .placeholder-area {
    width: 40px; /* 保持与 logo-area 等宽 */
  }

  .nav-item {
    padding: 0 10px;
    font-size: 14px;
  }
}

/* 更小屏幕的额外调整 */
@media (max-width: 480px) {
  .header-container {
    padding: 0 5px;
  }

  .logo-area {
    width: 32px; /* 调整宽度 */
  }

  .placeholder-area {
    width: 32px; /* 保持与 logo-area 等宽 */
  }

  .nav-item {
    padding: 0 8px;
    font-size: 13px;
  }

  .nav-item .el-icon {
    margin-right: 3px;
    font-size: 16px;
  }
}

/* 超小屏幕 */
@media (max-width: 360px) {
  .nav-item {
    padding: 0 5px;
    font-size: 12px;
  }
}
</style>
