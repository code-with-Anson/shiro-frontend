<template>
  <div class="renew-bill">
    <h1 class="page-title">循环账单</h1>
    <div class="renew-category-collapse">
      <el-collapse v-model="activeName">
        <el-collapse-item
          v-for="renewcategory in RenewCategories"
          :key="renewcategory.id"
          :title="renewcategory.name"
          :name="renewcategory.id"
        >
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getAllRenewCategories } from "@/api/renew_category";
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

// 定义循环账单分类结构
interface RenewCategory {
  id: string;
  name: string;
}

// Element组件-Collapse折叠面板所需
const activeName = ref("1");

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

onMounted(async () => {
  getUserRenewCategories();
});
</script>

<style scoped>
.renew-category-collapse {
  margin-top: 0rem;
  margin-left: 2rem;
  margin-right: 2rem;
}
.renew-bill :deep(.el-collapse-item__header) {
  font-weight: bold;
}

.page-title {
  margin-bottom: 1rem;
  margin-left: 2rem;
  font-size: 1.5rem;
  color: #39c5bb;
}
</style>
