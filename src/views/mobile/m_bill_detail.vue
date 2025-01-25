<template>
  <div class="m_bill_detail">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="账单详情"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 表单内容 -->
    <van-form @submit="updateThisBill">
      <!-- 金额输入 -->
      <van-field
        v-model="billForm.amount"
        type="number"
        label="金额"
        placeholder="请输入金额"
        :rules="[{ required: true, message: '请输入金额' }]"
      />

      <!-- 类型选择 -->
      <van-field
        v-model="billForm.type"
        is-link
        readonly
        name="type"
        label="类型"
        placeholder="请选择类型"
        @click="showTypePopup = true"
      />
      <van-popup v-model:show="showTypePopup" position="bottom">
        <van-picker
          :columns="typeColumns"
          @confirm="onTypeConfirm"
          @cancel="showTypePopup = false"
        />
      </van-popup>

      <!-- 分类选择 -->
      <van-field
        v-model="billForm.categoryName"
        is-link
        readonly
        name="category"
        label="分类"
        placeholder="请选择分类"
        @click="showCategoryPopup = true"
      />
      <van-popup v-model:show="showCategoryPopup" position="bottom">
        <van-picker
          :columns="categoryColumns"
          @confirm="onCategoryConfirm"
          @cancel="showCategoryPopup = false"
        />
      </van-popup>

      <!-- 日期选择 -->
      <van-field
        v-model="billForm.date"
        is-link
        readonly
        name="date"
        label="日期"
        placeholder="请选择日期"
        @click="showDatePicker = true"
      />
      <van-popup v-model:show="showDatePicker" position="bottom">
        <van-date-picker
          v-model="currentDate"
          title="选择日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>

      <!-- 备注输入 -->
      <van-field
        v-model="billForm.detail"
        rows="2"
        autosize
        label="备注"
        type="textarea"
        placeholder="请输入备注"
      />

      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 5rem auto;
          width: 15rem;
          align-items: center;
        "
      >
        <van-button round block type="primary" native-type="submit">
          保存
        </van-button>
        <van-button round block plain type="primary" @click="deleteThisBill">
          删除
        </van-button>
        <van-button round block plain type="primary" @click="showCategoryEdit">
          编辑分类
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { updateBill } from "@/api/bill";
import { ElMessage } from "element-plus";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

// 表单数据
const billForm = ref({
  id: 0,
  amount: "",
  type: "",
  categoryId: 0,
  categoryName: "",
  detail: "",
  date: "",
});

// 控制各个弹出层的显示
const showTypePopup = ref(false);
const showCategoryPopup = ref(false);
const showDatePicker = ref(false);

// 类型选项
const typeColumns = ref([
  { text: "支出", value: "支出" },
  { text: "收入", value: "收入" },
]);
// 分类选项
const categoryColumns = ref<{ text: string; value: string }[]>([]);
const categoriesMap = ref<Record<string, any>>({});

// 日期选择器配置
const currentDate = ref([""]);

const minDate = new Date(1900, 0);
const maxDate = new Date(new Date().getFullYear() + 100, 0); // 当前日期

// 返回按钮处理
const onClickLeft = () => {
  router.back();
};

// 类型选择处理
const onTypeConfirm = (value: any) => {
  // Picker返回的是一个对象，我们需要从selectedValues中取第一个值
  billForm.value.type = value.selectedValues[0];
  showTypePopup.value = false;
};

// 分类选择处理
const onCategoryConfirm = (value: any) => {
  // 同样从selectedValues中取值
  const categoryName = value.selectedValues[0];
  billForm.value.categoryName = categoryName;

  // 从categoriesMap中获取分类信息
  const category = categoriesMap.value[categoryName];
  if (category) {
    billForm.value.categoryId = category.id;
  }
  showCategoryPopup.value = false;
};

// 日期选择处理
const onDateConfirm = (value: { selectedValues: string[] }) => {
  const dateStr = value.selectedValues.join("-");
  billForm.value.date = dateStr;
  showDatePicker.value = false;
};

// 初始化分类数据
const initCategories = () => {
  const storedCategories = localStorage.getItem("categories");
  if (storedCategories) {
    const categories = JSON.parse(storedCategories);

    // 转换为符合 PickerOption 类型的数组
    categoryColumns.value = categories.map((cat: any) => ({
      text: cat.name,
      value: cat.name,
    }));

    // 构建查找映射
    categories.forEach((cat: any) => {
      categoriesMap.value[cat.name] = cat;
    });
  } else {
    console.warn("本地存储没看着有分类数据啊");
  }
};
// 初始化账单数据
const initBillData = () => {
  const currentBillStr = localStorage.getItem("currentBill");

  if (!currentBillStr) {
    ElMessage({
      message: "未找到账单信息",
      type: "error",
      plain: true,
    });
    router.back();
    return;
  }

  try {
    const currentBill = JSON.parse(currentBillStr);
    billForm.value = { ...currentBill };
    // 如果有日期，更新日期选择器的值
    if (currentBill.date) {
      // 将日期字符串转换为数组格式
      currentDate.value = currentBill.date.split("-");
    }
  } catch (error) {
    console.error("解析账单数据失败:", error);
    ElMessage({
      message: "账单数据格式错误",
      type: "error",
      plain: true,
    });

    router.back();
  }
};
// 更新账单方法
const updateThisBill = async () => {
  try {
    // 构造更新数据，只包含修改的字段
    const updateData = {
      id: billForm.value.id,
      amount: Number(billForm.value.amount),
      categoryId: billForm.value.categoryId,
      date: billForm.value.date,
      detail: billForm.value.detail,
      type: billForm.value.type,
    };

    // 调用更新函数
    await updateBill(updateData);

    // 更新成功提示
    ElMessage({
      message: "更新成功！",
      type: "success",
      plain: true,
    });

    // 清除当前账单缓存
    localStorage.removeItem("currentBill");

    // 返回上一页
    router.back();
  } catch (error: any) {
    // 错误提示
    ElMessage({
      message: error.message || "更新失败，请稍后重试",
      type: "error",
      plain: true,
    });
  }
};

// 删除账单处理函数
const deleteThisBill = () => {
  // 暂时添加一个空函数，等待具体实现
  console.log("删除账单功能待实现");
};

// 显示分类编辑处理函数
const showCategoryEdit = () => {
  // 暂时添加一个空函数，等待具体实现
  console.log("显示分类编辑功能待实现");
};

onMounted(() => {
  initCategories();
  initBillData();
});

onUnmounted(() => {
  localStorage.removeItem("currentBill");
});
</script>

<style scoped>
.m_bill_detail {
  height: 90vh; /* 使容器占据较大的视口高度 */
}

.van-form {
  margin-top: 1rem;
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
</style>
