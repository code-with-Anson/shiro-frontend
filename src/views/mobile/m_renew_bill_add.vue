<template>
  <div class="add-renew-bill">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="添加循环账单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 表单内容 -->
    <van-form @submit="addNewRenewBill">
      <!-- 账单名称 -->
      <van-field
        v-model="billForm.name"
        label="账单名称"
        placeholder="请输入账单名称"
        :rules="RenewBillNameRules"
      />

      <!-- 账单金额 -->
      <van-field
        v-model="billForm.cost"
        type="number"
        label="金额"
        placeholder="请输入金额"
        :rules="RenewBillAmountRule"
      />

      <!-- 分类选择 -->
      <van-field
        v-model="billForm.categoryName"
        is-link
        readonly
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

      <!-- 付款周期 -->
      <van-field
        v-model="billForm.cycle"
        is-link
        readonly
        label="付款周期"
        placeholder="请选择付款周期"
        :rules="[{ required: true, message: '请选择付款周期' }]"
        @click="handleCycleClick"
      />
      <van-popup v-model:show="showCyclePopup" position="bottom">
        <van-picker
          :columns="cycleColumns"
          @confirm="onCycleConfirm"
          @cancel="showCyclePopup = false"
        />
      </van-popup>

      <!-- 开始日期 -->
      <van-field
        v-model="billForm.beginning"
        is-link
        readonly
        label="开始日期"
        placeholder="请选择开始日期"
        :rules="[{ required: true, message: '请选择开始日期' }]"
        @click="updateBeginDatePicker"
      />
      <van-popup v-model:show="showBeginDatePicker" position="bottom">
        <van-date-picker
          v-model="beginDate"
          title="选择开始日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onBeginDateConfirm"
          @cancel="showBeginDatePicker = false"
        />
      </van-popup>

      <!-- 结束日期 -->
      <van-field
        v-model="billForm.ending"
        is-link
        readonly
        label="结束日期"
        placeholder="请选择结束日期"
        :rules="[{ required: true, message: '请选择结束日期' }]"
        @click="updateEndDatePicker"
      />
      <van-popup v-model:show="showEndDatePicker" position="bottom">
        <van-date-picker
          v-model="endDate"
          title="选择结束日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onEndDateConfirm"
          @cancel="showEndDatePicker = false"
        />
      </van-popup>

      <!-- 备注输入 -->
      <van-field
        v-model="billForm.details"
        rows="2"
        autosize
        label="备注"
        type="textarea"
        placeholder="请输入备注(最多100字)"
        maxlength="100"
        show-word-limit
      />

      <div style="margin: 5rem auto; width: 15rem; align-items: center">
        <van-button round block type="primary" native-type="submit">
          添加
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { RenewBillNameRules, RenewBillAmountRule } from "@/utils/validators";
import { addRenewBill } from "@/api/renew_bill";

const router = useRouter();
// 帮助函数：获取当前日期的年月日数组
const getCurrentDateArray = () => {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return [year, month, day];
};
// 帮助函数：格式化日期数组为字符串
const formatDateArray = (dateArray: string[]) => {
  return dateArray.join("-");
};
// 表单数据
const billForm = ref({
  name: "",
  cost: "",
  categoryId: 0,
  categoryName: "",
  cycle: "日付",
  beginning: formatDateArray(getCurrentDateArray()), // 设置默认开始日期
  ending: formatDateArray(getCurrentDateArray()), // 设置默认结束日期
  details: "",
  renew: "未开启", // 默认未开启自动续费
});

// 控制弹出层显示
const showCategoryPopup = ref(false);
const showCyclePopup = ref(false);
const showBeginDatePicker = ref(false);
const showEndDatePicker = ref(false);

// 日期选择器数据
const beginDate = ref<string[]>(getCurrentDateArray());
const endDate = ref<string[]>(getCurrentDateArray());

const minDate = new Date(1900, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 100, 11, 31);

// 付款周期选项
const cycleColumns = [
  { text: "日付", value: "日付" },
  { text: "周付", value: "周付" },
  { text: "月付", value: "月付" },
  { text: "年付", value: "年付" },
];

// 分类数据管理
const allCategories = ref<Array<{ id: string; name: string }>>([]);
const categoriesMap = ref<Record<string, string>>({});
const categoryColumns = ref<{ text: string; value: string }[]>([]);

// 返回按钮处理
const onClickLeft = () => {
  router.back();
};

// 分类选择处理
const handleCategoryClick = () => {
  showCategoryPopup.value = true;
};

const onCategoryConfirm = (value: any) => {
  const selectedId = value.selectedOptions[0].value;
  billForm.value.categoryId = selectedId;
  billForm.value.categoryName = categoriesMap.value[selectedId];
  showCategoryPopup.value = false;
};

// 周期选择处理
const handleCycleClick = () => {
  showCyclePopup.value = true;
};

const onCycleConfirm = (value: any) => {
  billForm.value.cycle = value.selectedOptions[0].value;
  showCyclePopup.value = false;
};

// 日期选择处理
const onBeginDateConfirm = (value: any) => {
  const formattedDate = value.selectedValues
    .map((v: string, i: number) => {
      return i > 0 ? v.padStart(2, "0") : v;
    })
    .join("-");
  billForm.value.beginning = formattedDate;
  showBeginDatePicker.value = false;
};

const onEndDateConfirm = (value: any) => {
  const formattedDate = value.selectedValues
    .map((v: string, i: number) => {
      return i > 0 ? v.padStart(2, "0") : v;
    })
    .join("-");
  billForm.value.ending = formattedDate;
  showEndDatePicker.value = false;
};

// 日期选择器默认值设置
const updateBeginDatePicker = () => {
  if (!beginDate.value.length) {
    beginDate.value = getCurrentDateArray();
  }
  showBeginDatePicker.value = true;
};
const updateEndDatePicker = () => {
  if (!endDate.value.length) {
    endDate.value = getCurrentDateArray();
  }
  showEndDatePicker.value = true;
};

// 初始化分类数据
const initCategories = () => {
  const storedRenewCategories = localStorage.getItem("RenewCategories");
  if (storedRenewCategories) {
    try {
      const categories = JSON.parse(storedRenewCategories);
      allCategories.value = categories;

      categories.forEach((cat: { id: string; name: string }) => {
        categoriesMap.value[cat.id] = cat.name;
      });

      categoryColumns.value = categories.map((cat: { name: any; id: any }) => ({
        text: cat.name,
        value: cat.id,
      }));
    } catch (error) {
      console.error("解析分类数据失败:", error);
    }
  }
};

// 修改添加循环账单的方法
const addNewRenewBill = async () => {
  try {
    // 构造添加数据
    const addData = {
      name: billForm.value.name,
      cost: Number(billForm.value.cost),
      categoryId: Number(billForm.value.categoryId),
      cycle: billForm.value.cycle,
      beginning: billForm.value.beginning,
      ending: billForm.value.ending,
      details: billForm.value.details,
      renew: billForm.value.renew,
    };

    // 调用添加 API
    await addRenewBill(addData);

    // 添加成功后返回
    router.back();
  } catch (error: any) {
    ElMessage({
      message: error.message || "添加失败，请稍后重试",
      type: "error",
      plain: true,
    });
  }
};
onMounted(() => {
  initCategories();
});
</script>

<style scoped>
.add-renew-bill {
  height: 90vh;
}

.van-form {
  margin-top: 1rem;
}
</style>
