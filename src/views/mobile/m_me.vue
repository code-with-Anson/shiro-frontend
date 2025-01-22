<template>
  <div class="m_me">
    <!-- 添加input file并隐藏 -->
    <div style="display: none">
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleAvatarChange"
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
import { getUserInfos, logout } from "@/api/user";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import "vant/lib/index.css";
import { onMounted, ref } from "vue";
import { handleImageChange } from "@/api/avatarHandle";

// 数据结构定义部分：
const user = ref({
  userId: 0,
  email: "",
  name: "",
  sex: "",
  avatar: "",
});

// 添加文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);
// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};
// 使用在api中定义好的 handleImageChange 函数
const handleAvatarChange = async (event: Event) => {
  await handleImageChange(event, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
    onSuccess: (imageUrl) => {
      console.log("上传成功，新的头像地址:", imageUrl);
      user.value.avatar = imageUrl;
    },
    onError: (error) => {
      console.error("上传失败:", error);
    },
    onProgress: (progress) => {
      console.log("上传进度:", progress);
    },
    cosConfig: {
      SecretId: import.meta.env.VITE_COS_SECRET_ID,
      SecretKey: import.meta.env.VITE_COS_SECRET_KEY,
      Bucket: import.meta.env.VITE_COS_BUCKET,
      Region: import.meta.env.VITE_COS_REGION,
    },
  });
};

// 路由跳转
const router = useRouter();

// 退出登录
const Logout = () => {
  logout();
  showSuccessToast("退出登录成功");
  router.push("/login");
};

onMounted(async () => {
  try {
    const userInfo = await getUserInfos();
    user.value = userInfo;
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }

  console.log(user);
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
