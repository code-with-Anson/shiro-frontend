<template>
  <div class="me-page">
    <!-- 隐藏的文件输入框，用于上传头像 -->
    <input
      type="file"
      ref="fileInput"
      accept="image/*"
      @change="handleAvatarChange"
      style="display: none"
    />

    <!-- 个人信息主卡片 -->
    <el-card class="user-card">
      <div class="user-info-container">
        <!-- 左侧用户头像区域 -->
        <div class="avatar-section">
          <div class="avatar-container" @click="triggerFileInput">
            <el-avatar :size="150" :src="user.avatar" />
            <div class="avatar-overlay">
              <el-icon><camera /></el-icon>
            </div>
          </div>
          <h2 class="username">{{ user.name }}</h2>
          <p class="user-email">{{ user.email }}</p>
        </div>

        <!-- 右侧用户详细信息区域 -->
        <div class="user-details-section">
          <h3 class="section-title">个人资料</h3>

          <div class="user-form">
            <div class="info-item clickable" @click="showEmailEdit">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ user.email }}</span>
            </div>

            <div class="info-item clickable" @click="showNameEdit">
              <span class="info-label">昵称</span>
              <span class="info-value">{{ user.name }}</span>
            </div>

            <div class="info-item clickable" @click="showSexEdit">
              <span class="info-label">性别</span>
              <span class="info-value">{{ user.sex || "未设置" }}</span>
            </div>
          </div>

          <div class="actions-section">
            <el-button type="primary" @click="showPasswordEdit">
              <el-icon><lock /></el-icon>修改密码
            </el-button>
            <el-button type="success" @click="showExportDialog">
              <el-icon><document /></el-icon>导出账单
            </el-button>
            <el-button type="danger" @click="handleLogout">
              <el-icon><switch-button /></el-icon>退出登录
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 邮箱修改对话框 -->
    <el-dialog
      v-model="showEdit"
      :title="`编辑${editTypeText}`"
      width="30%"
      center
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="editFormData"
        label-width="80px"
        :rules="formRules"
        @submit.prevent="handleSubmit"
      >
        <!-- 邮箱编辑 -->
        <template v-if="editType === 'email'">
          <el-form-item label="新邮箱" prop="value">
            <el-input v-model="editFormData.value" placeholder="请输入新邮箱" />
          </el-form-item>
          <el-form-item label="确认邮箱" prop="confirmValue">
            <el-input
              v-model="editFormData.confirmValue"
              placeholder="请再次输入新邮箱"
            />
          </el-form-item>
        </template>

        <!-- 昵称编辑 -->
        <template v-else-if="editType === 'name'">
          <el-form-item label="新昵称" prop="value">
            <el-input v-model="editFormData.value" placeholder="请输入新昵称" />
          </el-form-item>
        </template>

        <!-- 性别编辑 -->
        <template v-else-if="editType === 'sex'">
          <el-form-item label="性别" prop="value">
            <el-radio-group v-model="editFormData.value">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 密码修改 -->
        <template v-else-if="editType === 'password'">
          <el-form-item label="新密码" prop="value">
            <el-input
              v-model="editFormData.value"
              type="password"
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmValue">
            <el-input
              v-model="editFormData.confirmValue"
              type="password"
              placeholder="请确认新密码"
              show-password
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEdit = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导出账单对话框 -->
    <el-dialog
      v-model="showExport"
      title="导出月度账单"
      width="30%"
      center
      destroy-on-close
    >
      <el-form
        ref="exportFormRef"
        :model="exportFormData"
        label-width="80px"
        @submit.prevent="handleExport"
      >
        <el-form-item label="年份" prop="year" required>
          <el-input-number
            v-model="exportFormData.year"
            :min="2000"
            :max="2100"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="月份" prop="month">
          <el-select
            v-model="exportFormData.month"
            placeholder="选择月份"
            clearable
          >
            <el-option v-for="i in 12" :key="i" :label="`${i}月`" :value="i" />
          </el-select>
          <div class="month-hint">不选择月份将导出全年数据</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExport = false">取消</el-button>
          <el-button type="primary" @click="handleExport" :loading="exporting"
            >确定导出</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 导出中的遮罩 -->
    <el-dialog
      v-model="exportingOverlay"
      title="正在导出"
      width="30%"
      center
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="exporting-content">
        <el-icon class="is-loading export-loading-icon"><loading /></el-icon>
        <p class="loading-text">正在准备账单数据...</p>
        <p class="loading-tip">请稍候，数据将发送至您的邮箱</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { getUserInfos, updateUserInfos, logout } from "@/api/user";
import { handleImageChange } from "@/api/avatarHandle";
import { exportMonthlyBillsToEmail } from "@/api/exportData";
import {
  Camera,
  Lock,
  Document,
  SwitchButton,
  Loading,
} from "@element-plus/icons-vue";

// 用户信息
const user = ref({
  userId: 0,
  email: "",
  name: "",
  sex: "",
  avatar: "",
});

// 表单引用
const formRef = ref<FormInstance>();
const exportFormRef = ref<FormInstance>();
const fileInput = ref<HTMLInputElement | null>(null);

// 编辑状态管理
const showEdit = ref(false);
const editType = ref("");
const editFormData = ref({
  value: "",
  confirmValue: "",
});

// 导出状态管理
const showExport = ref(false);
const exporting = ref(false);
const exportingOverlay = ref(false);
const exportFormData = ref({
  year: new Date().getFullYear(),
  month: "",
});

// 计算编辑类型文本
const editTypeText = computed(() => {
  const typeMap: Record<string, string> = {
    email: "邮箱",
    name: "昵称",
    sex: "性别",
    password: "密码",
  };
  return typeMap[editType.value] || "信息";
});

// 表单验证规则
const formRules = computed(() => {
  const baseRules = {
    value: [
      {
        required: true,
        message: `请输入${editTypeText.value}`,
        trigger: "blur",
      },
    ],
  };

  if (editType.value === "email") {
    return {
      ...baseRules,
      value: [
        { required: true, message: "请输入新邮箱", trigger: "blur" },
        { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
      ],
      confirmValue: [
        { required: true, message: "请确认新邮箱", trigger: "blur" },
        {
          validator: (rule: any, value: string, callback: any) => {
            if (value !== editFormData.value.value) {
              callback(new Error("两次输入的邮箱不一致"));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ],
    };
  } else if (editType.value === "name") {
    return {
      ...baseRules,
      value: [
        { required: true, message: "请输入昵称", trigger: "blur" },
        {
          min: 1,
          max: 10,
          message: "昵称长度在1到10个字符之间",
          trigger: "blur",
        },
      ],
    };
  } else if (editType.value === "password") {
    return {
      ...baseRules,
      value: [
        { required: true, message: "请输入新密码", trigger: "blur" },
        {
          min: 6,
          max: 15,
          message: "密码长度在6到15个字符之间",
          trigger: "blur",
        },
      ],
      confirmValue: [
        { required: true, message: "请确认新密码", trigger: "blur" },
        {
          validator: (rule: any, value: string, callback: any) => {
            if (value !== editFormData.value.value) {
              callback(new Error("两次输入的密码不一致"));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ],
    };
  }

  return baseRules;
});

// 路由实例
const router = useRouter();

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理头像更改
const handleAvatarChange = async (event: Event) => {
  await handleImageChange(event, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
    onSuccess: (imageUrl) => {
      console.log("上传成功，新的头像地址:", imageUrl);
      ElMessage({
        message: "头像更新成功",
        type: "success",
      });
      user.value.avatar = imageUrl;
    },
    onError: (error) => {
      console.error("上传失败:", error);
      ElMessage({
        message: `上传失败: ${error.message}`,
        type: "error",
      });
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

// 显示邮箱编辑对话框
const showEmailEdit = () => {
  editType.value = "email";
  editFormData.value = {
    value: user.value.email,
    confirmValue: "",
  };
  nextTick(() => {
    formRef.value?.clearValidate();
  });
  showEdit.value = true;
};

// 显示昵称编辑对话框
const showNameEdit = () => {
  editType.value = "name";
  editFormData.value = {
    value: user.value.name,
    confirmValue: "",
  };
  nextTick(() => {
    formRef.value?.clearValidate();
  });
  showEdit.value = true;
};

// 显示性别编辑对话框
const showSexEdit = () => {
  editType.value = "sex";
  editFormData.value = {
    value: user.value.sex,
    confirmValue: "",
  };
  showEdit.value = true;
};

// 显示密码修改对话框
const showPasswordEdit = () => {
  editType.value = "password";
  editFormData.value = {
    value: "",
    confirmValue: "",
  };
  nextTick(() => {
    formRef.value?.clearValidate();
  });
  showEdit.value = true;
};

// 显示导出对话框
const showExportDialog = () => {
  exportFormData.value = {
    year: new Date().getFullYear(),
    month: "",
  };
  showExport.value = true;
};

// 处理信息编辑提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      let updateData: any = {};

      if (editType.value === "password") {
        updateData = {
          password: editFormData.value.value,
        };
      } else {
        updateData = {
          [editType.value]: editFormData.value.value,
        };
      }

      await updateUserInfos(updateData);

      // 如果不是密码，更新本地用户信息显示
      if (editType.value !== "password") {
        (user.value as any)[editType.value] = editFormData.value.value;
      }

      showEdit.value = false;
      ElMessage({
        message: "更新成功",
        type: "success",
      });
    } catch (error: any) {
      ElMessage({
        message: `更新失败: ${error.message}`,
        type: "error",
      });
    }
  });
};

// 处理导出账单
const handleExport = async () => {
  try {
    const year = exportFormData.value.year;
    // 如果月份为空，则不传递月份参数
    const month =
      exportFormData.value.month === ""
        ? undefined
        : Number(exportFormData.value.month);

    // 验证月份范围
    if (month !== undefined && (month < 1 || month > 12)) {
      ElMessage({
        message: "月份必须在1-12之间",
        type: "warning",
      });
      return;
    }

    // 显示导出中的遮罩
    exporting.value = true;
    exportingOverlay.value = true;
    showExport.value = false;

    // 调用API导出账单
    await exportMonthlyBillsToEmail(year, month);
  } catch (error: any) {
    ElMessage({
      message: `导出失败: ${error.message}`,
      type: "error",
    });
  } finally {
    exporting.value = false;
    exportingOverlay.value = false;
  }
};

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗?", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      logout();
      router.push("/login");
      ElMessage({
        type: "success",
        message: "已成功退出登录",
      });
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 加载用户信息
onMounted(async () => {
  try {
    const userInfo = await getUserInfos();
    user.value = userInfo;
  } catch (error: any) {
    console.error("获取用户信息失败:", error);
    ElMessage({
      message: `获取用户信息失败: ${error.message}`,
      type: "error",
    });
  }
});
</script>

<style scoped>
.me-page {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.user-card {
  width: 800px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-info-container {
  display: flex;
  min-height: 500px;
}

.avatar-section {
  width: 280px;
  background: linear-gradient(135deg, #52a1e5 0%, #39c5bb 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  margin-bottom: 20px;
  width: 150px; /* 确保容器宽度与头像一致 */
  height: 150px; /* 确保容器高度与头像一致 */
  border-radius: 50%;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.avatar-overlay .el-icon {
  font-size: 32px;
  color: white;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.user-email {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-details-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 22px;
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.user-form {
  margin-bottom: auto;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  font-size: 0.25rem;
}

.info-label {
  width: 60px;
  font-size: 18px;
  color: #606266;
  font-weight: 500;
  text-align: left;
}

.info-value {
  flex: 1;
  font-size: 18px;
  color: #333;
}

.info-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 12px;
  margin: 0 -12px;
  border-radius: 4px;
}

.info-item.clickable:hover {
  background-color: #f5f7fa;
}

.info-item.clickable::after {
  content: "\270E";
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  color: #999;
}

.info-item.clickable:hover::after {
  opacity: 0.6;
}

.actions-section {
  display: flex;
  flex-direction: row; /* 水平排列按钮 */
  justify-content: space-between; /* 均匀分布按钮 */
  gap: 16px;
  margin-top: 24px;
}

.actions-section .el-button {
  flex: 1; /* 按钮等宽 */
}

.month-hint {
  font-size: 14px; /* 修改为 14px */
  color: #999;
  margin-top: 4px;
}

.exporting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.export-loading-icon {
  font-size: 48px;
  color: #52a1e5;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.loading-tip {
  font-size: 14px; /* 已经是 14px，保持不变 */
  color: #666;
}

:deep(.el-dialog__header) {
  padding: 8px 10px; /* 减小标题区域的内边距，特别是上下内边距 */
  margin: 6px; /* 移除标题底部margin */
  display: flex;
  align-items: center; /* 确保标题垂直居中 */
  height: 40px; /* 设置固定高度 */
}

/* 在样式最后添加以下代码 */

/* 调整导出对话框中的表单布局 */
:deep(.el-dialog__body) {
  padding-bottom: 10px; /* 减少底部内边距 */
  display: flex;
  justify-content: center; /* 整体内容居中 */
}

:deep(.el-dialog__body form) {
  width: 240px; /* 设置固定宽度以确保元素居中 */
}

:deep(.el-select),
:deep(.el-input-number) {
  width: 120px !important; /* 限制选择框宽度 */
}

:deep(.el-form-item__content) {
  display: flex;
  justify-content: center; /* 表单控件居中 */
  flex-direction: column; /* 垂直排列元素 */
  align-items: center; /* 子元素在交叉轴居中 */
}

:deep(.el-dialog__footer) {
  padding-top: 10px; /* 减少底部按钮区域与表单之间的距离 */
  margin-top: -10px; /* 通过负边距进一步减少空间 */
}

:deep(.el-form--default .el-form-item--default) {
  margin-bottom: 18px; /* 减小表单项之间的间距 */
  text-align: center; /* 表单项文本居中 */
}

/* 紧凑型表单布局 */
:deep(.el-form-item:last-child) {
  margin-bottom: 0; /* 最后一个表单项去掉底部边距 */
}

/* 调整提示文字居中显示 */
.month-hint {
  text-align: center;
  width: 100%;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 调整表单标签对齐方式 */
:deep(.el-export-form .el-form-item__label) {
  text-align: center;
}

/* 确保按钮在dialog footer中居中 */
:deep(.dialog-footer) {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
