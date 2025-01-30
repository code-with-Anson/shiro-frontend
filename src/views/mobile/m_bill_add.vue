<template>
  <div class="m_bill_add">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="新增账单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 表单内容 -->
    <van-form @submit="addNewBill">
      <!-- 金额输入 -->
      <van-field
        v-model="billForm.amount"
        type="number"
        label="金额"
        placeholder="请输入金额"
        :rules="amountRules"
      />

      <!-- 类型选择 -->
      <van-field
        v-model="billForm.type"
        is-link
        readonly
        name="type"
        label="类型"
        placeholder="请选择类型"
        :rules="[{ required: true, message: '请选择类型' }]"
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
        :rules="[{ required: true, message: '请选择分类' }]"
        @click="handleCategoryClick"
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
        :rules="[{ required: true, message: '请选择日期' }]"
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

      <div style="margin: 2rem auto; width: 15rem">
        <van-button round block type="primary" native-type="submit">
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { addBill } from "@/api/bill"; // 确保已创建此API函数
import { ElMessage } from "element-plus";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { amountRules } from "@/utils/validators";

const router = useRouter();

// 表单数据 - 简化为新建所需的字段
const billForm = ref({
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

// 分类数据管理
const allCategories = ref<any[]>([]);
const categoriesMap = ref<Record<string, any>>({});

// 根据当前选择的类型计算显示的分类列表
const categoryColumns = computed(() => {
  if (!billForm.value.type) return [];

  return allCategories.value
    .filter((cat) => cat.categoryType === billForm.value.type)
    .map((cat) => ({
      text: cat.name,
      value: cat.name,
    }));
});

// 日期选择器配置
const currentDate = ref([""]);
const minDate = new Date(1900, 0);
const maxDate = new Date(new Date().getFullYear() + 100, 0);

// 返回按钮处理
const onClickLeft = () => {
  router.back();
};

// 类型选择处理函数改写
const onTypeConfirm = (value: any) => {
  const selectedType = value.selectedValues[0];
  billForm.value.type = selectedType;

  // 找到当前类型的第一个分类
  const firstCategory = allCategories.value.find(
    (cat) => cat.categoryType === selectedType
  );

  // 如果找到了分类，就自动设置它
  if (firstCategory) {
    billForm.value.categoryId = firstCategory.id;
    billForm.value.categoryName = firstCategory.name;
  } else {
    // 如果没找到分类，清空分类选择
    billForm.value.categoryId = 0;
    billForm.value.categoryName = "";
  }

  showTypePopup.value = false;
};
// 初始化分类数据
const initCategories = () => {
  const storedCategories = localStorage.getItem("categories");
  if (storedCategories) {
    try {
      const categories = JSON.parse(storedCategories);
      allCategories.value = categories;
      categories.forEach((cat: any) => {
        categoriesMap.value[cat.name] = cat;
      });
    } catch (error) {
      console.error("解析分类数据失败:", error);
      ElMessage({
        message: "分类数据格式错误",
        type: "error",
      });
    }
  }
};

// 处理分类点击事件
const handleCategoryClick = () => {
  if (!billForm.value.type) {
    ElMessage({
      message: "请先选择类型（支出/收入）",
      type: "warning",
    });
    return;
  }
  showCategoryPopup.value = true;
};

// 分类选择处理
const onCategoryConfirm = (value: any) => {
  const categoryName = value.selectedValues[0];
  billForm.value.categoryName = categoryName;
  const category = categoriesMap.value[categoryName];
  if (category) {
    billForm.value.categoryId = category.id;
  }
  showCategoryPopup.value = false;
};

// 新增账单方法
const addNewBill = async () => {
  try {
    const newBill = {
      amount: Number(billForm.value.amount),
      categoryId: billForm.value.categoryId,
      date: billForm.value.date,
      detail: billForm.value.detail,
      billType: billForm.value.type,
    };

    await addBill(newBill);

    ElMessage({
      message: "添加成功！",
      type: "success",
    });

    router.back();
  } catch (error: any) {
    ElMessage({
      message: error.message || "添加失败，请稍后重试",
      type: "error",
    });
  }
};

// 新增一个设置默认值的函数
const setDefaultValues = () => {
  // 设置默认类型为支出
  billForm.value.type = "支出";
  // 设置默认日期为今天
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");

  // 同时设置表单日期和日期选择器的值
  billForm.value.date = `${year}-${month}-${day}`;
  currentDate.value = [year, month, day]; // 日期选择器需要年月日分开的数组
  // 设置默认分类（第一个支出分类）
  const firstExpenseCategory = allCategories.value.find(
    (cat) => cat.categoryType === "支出"
  );

  if (firstExpenseCategory) {
    billForm.value.categoryId = firstExpenseCategory.id;
    billForm.value.categoryName = firstExpenseCategory.name;
  }
};
// 日期选择处理函数
const onDateConfirm = (value: { selectedValues: string[] }) => {
  const dateStr = value.selectedValues.join("-");
  billForm.value.date = dateStr;
  currentDate.value = value.selectedValues; // 保持日期选择器的值同步
  showDatePicker.value = false;
};
onMounted(() => {
  initCategories();
  setDefaultValues();
});
</script>

<style scoped>
.m_bill_add {
  height: 100vh;
}

.van-form {
  margin-top: 1rem;
}
</style>
