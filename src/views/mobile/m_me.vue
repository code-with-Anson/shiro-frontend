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
        <van-cell
          title="邮箱"
          :value="user.email"
          class="email-cell"
          is-link
          @click="showEmailEdit"
        />
        <van-cell
          title="昵称"
          :value="user.name"
          is-link
          @click="showNameEdit"
        />
        <van-cell title="性别" :value="user.sex" is-link @click="showSexEdit" />
        <van-cell
          title="修改密码"
          value="设置新密码"
          is-link
          @click="showPasswordEdit"
        />
        <!-- 新增导出数据按钮 -->
        <van-cell
          title="导出账单"
          value="发送至邮箱"
          is-link
          @click="showExportDialog"
        />
      </van-cell-group>
    </div>
    <!-- 添加弹出层 -->
    <van-popup
      v-model:show="showEdit"
      round
      position="center"
      class="edit-popup"
    >
      <div class="popup-title">编辑{{ editTypeText }}</div>
      <van-form ref="formRef" @submit="handleSubmit">
        <div v-if="editType === 'email'">
          <van-field
            v-model="editValue"
            label="邮箱"
            type="email"
            placeholder="请输入新邮箱"
            :rules="[{ required: true, message: '请输入新邮箱' }]"
          />
          <van-field
            v-model="confirmEmail"
            label="确认邮箱"
            type="email"
            placeholder="邮箱是唯一登录凭据！"
            :rules="[
              { required: true, message: '请确认新邮箱' },
              { validator: validateEmail, message: '两次输入的邮箱不一致' },
            ]"
          />
        </div>
        <van-field
          v-if="editType === 'name'"
          v-model="editValue"
          label="昵称"
          placeholder="请输入昵称"
          :rules="usernameRules"
        />
        <van-radio-group v-if="editType === 'sex'" v-model="editValue">
          <van-radio name="男">男</van-radio>
          <van-radio name="女">女</van-radio>
        </van-radio-group>

        <div v-if="editType === 'password'">
          <van-field
            v-model="newPassword"
            type="password"
            label="新密码"
            placeholder="请输入新密码"
            :rules="passwordRules"
          />
          <van-field
            v-model="confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入新密码"
            :rules="confirmPasswordRules"
          />
        </div>
        <div class="button-group">
          <van-button round native-type="button" @click="showEdit = false">
            取消
          </van-button>
          <van-button round type="primary" native-type="submit">
            确认
          </van-button>
        </div>
      </van-form>
    </van-popup>

    <!-- 新增导出选择弹窗 -->
    <van-popup
      v-model:show="showExport"
      round
      position="center"
      class="edit-popup"
    >
      <div class="popup-title">导出月度账单</div>
      <van-form @submit="handleExport">
        <!-- 年份选择 -->
        <van-field
          v-model="exportYear"
          name="year"
          label="年份"
          placeholder="请输入年份"
          type="number"
          :rules="[{ required: true, message: '请输入年份' }]"
        />
        <!-- 月份选择 -->
        <van-field
          v-model="exportMonth"
          name="month"
          label="月份"
          placeholder="可选，留空导出全年"
          type="number"
        />
        <div class="button-group">
          <van-button
            round
            native-type="button"
            @click="showExport = false"
            :disabled="exporting"
          >
            取消
          </van-button>
          <van-button
            round
            type="primary"
            native-type="submit"
            :loading="exporting"
            loading-text="导出中..."
          >
            导出
          </van-button>
        </div>
      </van-form>
    </van-popup>

    <!-- 添加全局加载指示器 -->
    <van-overlay
      :show="exportingOverlay"
      :z-index="9999"
      class="loading-overlay"
    >
      <div class="loading-content">
        <van-loading color="#1989fa" size="48px" />
        <p class="loading-text">正在准备账单数据...</p>
        <p class="loading-tip">请稍候，数据将发送至您的邮箱</p>
      </div>
    </van-overlay>

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
import { ElMessage } from "element-plus";
import { type FormInstance } from "vant";
import { onMounted, ref, computed, nextTick } from "vue";
import { handleImageChange } from "@/api/avatarHandle";
import { updateUserInfos } from "@/api/user";
import { passwordRules, usernameRules } from "@/utils/validators";
// 导入导出数据函数
import { exportMonthlyBillsToEmail } from "@/api/exportData";

// 数据结构定义部分：
const user = ref({
  userId: 0,
  email: "",
  name: "",
  sex: "",
  avatar: "",
});

// 数据结构定义部分
const editTypeText = computed(() => {
  const typeMap: any = {
    email: "邮箱",
    name: "昵称",
    sex: "性别",
    password: "密码",
  };
  return typeMap[editType.value];
});

// 编辑用户信息相关的响应式变量
const confirmEmail = ref("");
const formRef = ref<FormInstance>();
const showEdit = ref(false);
const editType = ref("");
const editValue = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

// 导出数据相关变量
const showExport = ref(false);
const exportYear = ref<string | number>(new Date().getFullYear());
const exportMonth = ref<string | number>("");

// 添加导出加载状态
const exporting = ref(false);
const exportingOverlay = ref(false);

// 打开编辑弹窗的方法
const showEmailEdit = () => {
  editType.value = "email";
  editValue.value = user.value.email;
  confirmEmail.value = ""; // 重置确认邮箱输入框状态
  // 重置表单验证状态
  nextTick(() => {
    formRef.value?.resetValidation();
  });
  showEdit.value = true;
};
const showNameEdit = () => {
  editType.value = "name";
  editValue.value = user.value.name;
  showEdit.value = true;
};

const showSexEdit = () => {
  editType.value = "sex";
  editValue.value = user.value.sex;
  showEdit.value = true;
};

const showPasswordEdit = () => {
  editType.value = "password";
  newPassword.value = "";
  confirmPassword.value = "";
  // 重置表单验证状态
  nextTick(() => {
    formRef.value?.resetValidation();
  });
  showEdit.value = true;
};

// 显示导出对话框
const showExportDialog = () => {
  exportYear.value = new Date().getFullYear();
  exportMonth.value = "";
  showExport.value = true;
};

// 确认两次输入的新邮箱保持一致
const validateEmail = () => {
  return editValue.value === confirmEmail.value;
};
// 确认两次输入的新密码保持一致
const validateNewPassword = () => {
  return newPassword.value === confirmPassword.value;
};
const confirmPasswordRules = [
  { required: true, message: "请确认新密码" },
  { validator: validateNewPassword, message: "两次输入的密码不一致" },
  {
    validator: (value: string) => value.length >= 6 && value.length <= 15,
    message: "密码在6到15位之间",
  },
];

// 路由
const router = useRouter();

// 添加文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);

// ---------------分割线---------------
// 下面是处理数据相关的方法
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
      ElMessage({
        message: "更新成功",
        type: "success",
        plain: true,
      });
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

// 处理编辑用户信息提交
const handleSubmit = async () => {
  try {
    let updateData;
    if (editType.value === "password") {
      // 这里使用一个单独的newPassword.value 来存储密码
      // 因为下面这一行的存在：(user.value as any)[editType.value] = editValue.value;
      // 所以不能直接const一个updateData
      // 因为返回的user类型里面没有password，密码是后端加密的，返回也没有意义
      // 所以这里只能手动判断一下赋值
      updateData = {
        password: newPassword.value,
      };
    } else {
      updateData = {
        [editType.value]: editValue.value,
      };
    }

    const result = await updateUserInfos(updateData);
    (user.value as any)[editType.value] = editValue.value;
    showEdit.value = false;
    ElMessage({
      message: "更新成功",
      type: "success",
      plain: true,
    });
  } catch (error: any) {
    ElMessage({
      message: "出现错误",
      type: "error",
      plain: true,
    });
  }
};

// 处理导出提交
const handleExport = async (values: { year: number; month?: number }) => {
  try {
    const year = Number(exportYear.value);
    // 如果月份为空，则不传递月份参数
    const month =
      exportMonth.value === "" ? undefined : Number(exportMonth.value);

    // 验证月份范围
    if (month !== undefined && (month < 1 || month > 12)) {
      ElMessage({
        message: "月份必须在1-12之间",
        type: "error",
        plain: true,
      });
      return;
    }

    // 使用加载状态回调
    await exportMonthlyBillsToEmail(year, month, (loading) => {
      exporting.value = loading;

      // 如果加载时间超过500ms，才显示全屏遮罩，避免闪烁
      if (loading) {
        setTimeout(() => {
          if (exporting.value) {
            exportingOverlay.value = true;
          }
        }, 500);
      } else {
        exportingOverlay.value = false;
      }
    });

    showExport.value = false;
  } catch (error: any) {
    // 错误处理，已在API中处理，这里不需要再显示错误消息
    console.error("导出错误:", error);
  }
};

// 退出登录
const Logout = () => {
  logout();
  ElMessage({
    message: "退出成功",
    type: "success",
    plain: true,
  });
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
.m_me {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90vh; /* 使容器占据较大的视口高度 */
}

/* Vant 按钮样式 */
:deep(.van-button) {
  width: 12rem;
}

.userDetails {
  margin-top: 2rem;
  width: 18rem;
}

/* 邮箱单元格样式 */
:deep(.van-cell__value) {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 弹出层样式 */
:deep(.edit-popup) {
  width: 80%;
  padding: 20px;
  border-radius: 8px;
}

/* 弹出层标题 */
.popup-title {
  text-align: center;
  font-size: 16px; /* 原来是 0.8rem */
  margin-bottom: 1rem;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  gap: 1rem;
}
/* 按钮组中的 Vant 按钮 */
:deep(.button-group .van-button) {
  flex: 1;
}

/* 单选按钮组样式 */
:deep(.van-radio-group) {
  padding: 1rem 0;
  display: flex;
  justify-content: space-around;
}

/* 添加样式 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.loading-text {
  margin-top: 16px;
  font-size: 16px; /* 保持 16px 大小 */
  font-weight: bold;
  color: #333;
}

.loading-tip {
  margin-top: 8px;
  font-size: 14px; /* 保持 14px 大小 */
  color: #666;
}

/* 按钮组样式 */
.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.button-group .van-button {
  flex: 1;
}
</style>
