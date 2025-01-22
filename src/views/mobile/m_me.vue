<template>
  <div class="m_me">
    <!-- 添加input file并隐藏 -->
    <div style="display: none">
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleFileChange"
      />
    </div>
    <!-- 头像选择器 -->
    <div class="avatar-wrapper" @click="triggerFileInput">
      <van-image
        round
        fit="cover"
        width="10rem"
        height="10rem"
        :src="user.avatar"
      />
    </div>

    <div class="userDeatilCells">
      <van-cell-group inset class="userDetails">
        <van-cell title="邮箱" :value="user.email" class="email-cell" />
        <van-cell title="昵称" :value="user.name" />
        <van-cell title="性别" :value="user.sex" />
      </van-cell-group>
    </div>
    <van-form @submit="Logout">
      <div
        style="
          margin: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        "
      >
        <van-button round block type="primary" native-type="submit">
          退出登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { logout } from "@/api/user";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import "vant/lib/index.css";
import { onMounted, ref } from "vue";

// 数据结构定义部分：
const user = ref({
  avatar: "",
  email: "",
  name: "",
  sex: "",
  token: "",
  userId: "",
});

// 添加文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);
// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件改变
const handleFileChange = (event: Event) => {
  try {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFailToast("请选择图片文件");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showFailToast("图片大小不能超过5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        user.value.avatar = e.target?.result as string;
        localStorage.setItem("user", JSON.stringify(user.value));
        showSuccessToast("头像更新成功");
      } catch (error) {
        showFailToast("头像更新失败");
        console.error("更新头像失败:", error);
      }
    };

    reader.onerror = () => {
      showFailToast("图片读取失败");
    };

    reader.readAsDataURL(file);
  } catch (error) {
    showFailToast("处理图片时出错");
    console.error("处理图片错误:", error);
  }
};
// 路由跳转
const router = useRouter();

// 退出登录
const Logout = () => {
  logout();
  showSuccessToast("退出登录成功");
  router.push("/login");
};

onMounted(() => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    user.value = JSON.parse(userStr);
    console.log("当前的用户昵称是" + user.value.name);
    console.log("当前的用户头像是" + user.value.avatar);
  }
});
</script>

<style scoped>
.van-button {
  width: 15rem; /* 或者其他适合的宽度 */
}

.m_me {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* 使容器占满整个视口高度 */
}

.userDetails {
  width: 20rem;
}

.email-cell :deep(.van-cell__value) {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
