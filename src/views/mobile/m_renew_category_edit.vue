<template>
  <div class="m_renew_category">
    <!-- 顶部导航 -->
    <van-sticky>
      <van-nav-bar
        title="编辑循环账单分类"
        left-text="返回"
        left-arrow
        @click-left="onClickLeft"
      />
    </van-sticky>
    <div class="cell-group-renew-categories">
      <!-- 循环账单分类列表 -->
      <van-cell-group>
        <!-- v-for 必须移到 van-swipe-cell 层级 -->
        <template v-for="item in RenewCategories" :key="item.id">
          <van-swipe-cell>
            <!-- 账单项目 -->
            <van-cell :title="item.name" title-class="renew-category-name" />
            <template #right>
              <van-button
                square
                type="primary"
                text="编辑"
                @click="openNameEdit(item.id, item.name)"
              />
              <van-button
                square
                type="danger"
                text="删除"
                @click="deleteThisCategory(item.id)"
              />
            </template>
          </van-swipe-cell>
        </template>
      </van-cell-group>
    </div>
    <!-- 添加弹出层 -->
    <!-- 添加弹出层 -->
    <van-popup
      v-model:show="showEdit"
      round
      position="center"
      class="edit-popup"
    >
      <div class="popup-title">
        {{ editType === "addNewCategory" ? "添加新分类" : "编辑分类名称" }}
      </div>
      <van-form ref="formRef" @submit="handleSubmit">
        <!-- 使用同一个表单字段，根据 editType 显示不同的 label -->
        <van-field
          v-model="newCategoryName"
          :label="editType === 'addNewCategory' ? '新分类' : '分类名称'"
          :placeholder="
            editType === 'addNewCategory'
              ? '请输入新分类名称'
              : '请输入分类名称'
          "
          :rules="RenewCategoryRules"
        />
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

    <div class="bottom-bar">
      <van-button
        id="add-button"
        icon="plus"
        color="#39C5BB"
        @click="openAddCategory"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  addNewCategory,
  deleteRenewCategory,
  getAllRenewCategories,
  updateRenewCategory,
} from "@/api/renew_category";
import { ElMessage } from "element-plus";
import { RenewCategoryRules } from "@/utils/validators";
import { showConfirmDialog } from "vant";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

// 弹出层相关的响应式变量
const showEdit = ref(false);
const newCategoryName = ref("");
const currentEditId = ref<string>("");
const editType = ref<"addNewCategory" | "editCategory">("editCategory");

// 定义循环账单分类结构
interface RenewCategory {
  id: string;
  name: string;
}

const router = useRouter();
// 这里定义使用到的循环账单分类的数据结构
const RenewCategories = ref<RenewCategory[]>([]);

// 获取用户循环账单分类
const getUserRenewCategories = async () => {
  try {
    await getAllRenewCategories();
    const storedRenewCategories = localStorage.getItem("RenewCategories");
    if (storedRenewCategories) {
      RenewCategories.value = JSON.parse(storedRenewCategories);
      console.log("存储的循环账单分类:", RenewCategories.value);
    }
  } catch (error: any) {
    console.error("获取分类失败:", error);
    ElMessage({
      message: "获取分类失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

// 打开添加新循环分类弹窗
const openAddCategory = () => {
  editType.value = "addNewCategory";
  newCategoryName.value = "";
  showEdit.value = true;
};

// 打开编辑循环分类弹窗
const openNameEdit = (id: string, name: string) => {
  editType.value = "editCategory";
  currentEditId.value = id;
  newCategoryName.value = name;
  showEdit.value = true;
};

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (editType.value === "addNewCategory") {
      // 处理添加新分类
      await addNewCategory(newCategoryName.value);
    } else {
      // 处理编辑分类
      await updateRenewCategory(currentEditId.value, newCategoryName.value);
    }

    // 更新成功后刷新列表
    await getUserRenewCategories();

    // 关闭弹窗和清空表单
    showEdit.value = false;
    newCategoryName.value = ""; // 重置输入框的值
  } catch (error: any) {
    ElMessage({
      message: error.message || "操作失败，请稍后重试", // 改为更通用的错误提示
      type: "error",
      plain: true,
    });
  }
};

// 删除循环分类处理函数
const deleteThisCategory = async (categoryId: string) => {
  try {
    // 将单个 id 放入数组中
    const renewCategoryIdsToDelete: number[] = [Number(categoryId)];

    // showDialog 返回一个 Promise，resolve 为 true 表示点击确认，为 false 表示点击取消
    const confirmed = await showConfirmDialog({
      title: "确认删除",
      message: "删除循环账单分类时，会将对应的循环账单一起删除，是否删除？",
      showCancelButton: true,
      width: "20rem",
      confirmButtonColor: "#ff7875",
    }).catch(() => false); // 将取消操作转换为 false
    // 只有用户确认后才继续执行删除操作
    if (!confirmed) {
      return; // 用户取消，直接返回
    }

    // 传递 id 数组给删除函数
    await deleteRenewCategory(renewCategoryIdsToDelete);
    getUserRenewCategories();
    // 删除成功后显示提示
    ElMessage({
      message: "删除成功！",
      type: "success",
      plain: true,
    });
  } catch (error: any) {
    // 删除失败时显示错误信息
    ElMessage({
      message: error.message || "删除失败，请稍后重试",
      type: "error",
      plain: true,
    });
  }
};

// 返回上一页
const onClickLeft = () => {
  router.back();
};
onMounted(async () => {
  getUserRenewCategories();
});
</script>

<style>
.renew-category-name {
  font-weight: bold;
  color: #52a1e5;
}

.cell-group-renew-categories {
  margin-left: 1rem;
}

/* 弹出层样式 */
.edit-popup {
  padding: 1rem;
  width: 80%;
  border-radius: 8px;
}

.popup-title {
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
}
.button-group .van-button {
  width: 40%;
}

#add-button {
  border-radius: 50%;
  font-size: 1.5rem;
  width: 4rem;
  height: 4rem;
  position: fixed;
  bottom: 5rem;
  right: 1rem;
}

.m_renew_category {
  padding-bottom: 10rem; /* 替换原来的 margin-bottom */
}
</style>
