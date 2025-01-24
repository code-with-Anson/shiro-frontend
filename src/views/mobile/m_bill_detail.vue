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
    <van-form @submit="onSubmit">
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

      <!-- 提交按钮 -->
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">
          保存修改
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

// 表单数据
const billForm = ref({
  id: "",
  amount: "",
  type: "",
  categoryId: "",
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
const minDate = new Date(2000, 0, 1);
const maxDate = new Date(2099, 11, 31);

// 返回按钮处理
const onClickLeft = () => {
  router.back();
};

// 类型选择处理
const onTypeConfirm = (value: string) => {
  billForm.value.type = value;
  showTypePopup.value = false;
};

// 分类选择处理
const onCategoryConfirm = (value: string) => {
  billForm.value.categoryName = value;
  billForm.value.categoryId = categoriesMap.value[value].id;
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
    categories.forEach((cat: any) => {
      categoriesMap.value[cat.name] = cat;
    });
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

// 保存修改
const onSubmit = async () => {
  try {
    const storedBills = localStorage.getItem("bills");
    if (storedBills) {
      let bills = JSON.parse(storedBills);
      const index = bills.findIndex((b: any) => b.id === billForm.value.id);
      if (index !== -1) {
        bills[index] = { ...billForm.value };
        localStorage.setItem("bills", JSON.stringify(bills));
        // 清除 currentBill
        localStorage.removeItem("currentBill");
        router.back();
        ElMessage({
          message: "修改成功",
          type: "success",
          plain: true,
        });
      }
    }
  } catch (error) {
    ElMessage({
      message: "修改失败",
      type: "error",
      plain: true,
    });

    console.error("保存修改失败:", error);
  }
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
  margin-top: 12px;
}
</style>
