<template>
  <div class="edit-renew-bill">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="编辑循环账单"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 表单内容 -->
    <van-form @submit="updateThisRenewBill">
      <!-- 账单名称 -->
      <van-field
        v-model="billForm.name"
        label="账单名称"
        placeholder="请输入账单名称"
        :rules="[{ required: true, message: '请输入账单名称' }]"
      />

      <!-- 账单金额 -->
      <van-field
        v-model="billForm.cost"
        type="number"
        label="金额"
        placeholder="请输入金额"
        :rules="[{ required: true, message: '请输入金额' }]"
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
          :default-index="defaultCategoryIndex"
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
          :default-index="defaultCycleIndex"
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
        <van-button
          round
          block
          plain
          type="danger"
          @click="deleteThisRenewBill"
        >
          删除
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { showConfirmDialog } from "vant";
import { deleteRenewBill, updateRenewBill } from "@/api/renew_bill";

const router = useRouter();

// 表单数据
const billForm = ref({
  id: 0,
  name: "",
  cost: "",
  categoryId: 0,
  categoryName: "",
  cycle: "",
  beginning: "",
  ending: "",
  details: "",
  renew: "",
});

// 控制弹出层显示
const showCategoryPopup = ref(false);
const showCyclePopup = ref(false);
const showBeginDatePicker = ref(false);
const showEndDatePicker = ref(false);

// 日期选择器数据
const beginDate = ref<string[]>([]);
const endDate = ref<string[]>([]);
const minDate = new Date(1900, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 100, 11, 31);
// 付款周期选项
const cycleColumns = [
  {
    text: "日付",
    value: "日付",
  },
  {
    text: "周付",
    value: "周付",
  },
  {
    text: "月付",
    value: "月付",
  },
  {
    text: "年付",
    value: "年付",
  },
];

// 分类数据管理
const allCategories = ref<Array<{ id: string; name: string }>>([]);
const categoriesMap = ref<Record<string, string>>({}); // id 到 name 的映射
const categoryColumns = ref<{ text: string; value: string }[]>([]);
const defaultCategoryIndex = ref(0); // 新增：默认选中的分类索引
const defaultCycleIndex = ref(0); // 新增：默认选中的周期索引

// 返回按钮处理
const onClickLeft = () => {
  localStorage.removeItem("currentRenewBill");
  router.back();
};

// 分类选择处理
const handleCategoryClick = () => {
  // 找到当前分类的索引
  defaultCategoryIndex.value = categoryColumns.value.findIndex(
    (item) => item.value === billForm.value.categoryId.toString()
  );
  showCategoryPopup.value = true;
};

// 分类选择处理
const onCategoryConfirm = (value: any) => {
  const selectedId = value.selectedOptions[0].value;
  billForm.value.categoryId = selectedId;
  billForm.value.categoryName = categoriesMap.value[selectedId];
  showCategoryPopup.value = false;
};
// 周期选择处理
const onCycleConfirm = (value: any) => {
  billForm.value.cycle = value.selectedOptions[0].value; // 修改这里，使用 selectedOptions
  showCyclePopup.value = false;
};
// 日期选择处理
const onBeginDateConfirm = (value: any) => {
  billForm.value.beginning = value.selectedValues.join("-");
  showBeginDatePicker.value = false;
};

const onEndDateConfirm = (value: any) => {
  billForm.value.ending = value.selectedValues.join("-");
  showEndDatePicker.value = false;
};

// 初始化分类数据
const initCategories = () => {
  const storedRenewCategories = localStorage.getItem("RenewCategories");
  if (storedRenewCategories) {
    try {
      const categories = JSON.parse(storedRenewCategories);
      allCategories.value = categories;

      // 构建 ID 到名称的映射
      categories.forEach((cat: { id: string; name: string }) => {
        categoriesMap.value[cat.id] = cat.name;
      });

      // 设置选择器数据
      categoryColumns.value = categories.map((cat: { name: any; id: any }) => ({
        text: cat.name,
        value: cat.id, // 使用 id 作为值
      }));
    } catch (error) {
      console.error("解析分类数据失败:", error);
    }
  }
};

// 付款周期点击处理
const handleCycleClick = () => {
  // 找到当前周期的索引
  defaultCycleIndex.value = cycleColumns.findIndex(
    (item) => item.value === billForm.value.cycle
  );
  showCyclePopup.value = true;
};

// 日期选择器默认值设置
const updateBeginDatePicker = () => {
  if (billForm.value.beginning) {
    const [year, month, day] = billForm.value.beginning.split("-");
    beginDate.value = [year, month, day];
  }
  showBeginDatePicker.value = true;
};

const updateEndDatePicker = () => {
  if (billForm.value.ending) {
    const [year, month, day] = billForm.value.ending.split("-");
    endDate.value = [year, month, day];
  }
  showEndDatePicker.value = true;
};

// 初始化账单数据时，设置正确的分类名称
const initBillData = () => {
  const currentBillStr = localStorage.getItem("currentRenewBill");
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
    billForm.value = {
      ...currentBill,
      cost: currentBill.cost.toString(),
      categoryName: categoriesMap.value[currentBill.categoryId], // 根据 categoryId 设置 categoryName
    };
  } catch (error) {
    console.error("解析账单数据失败:", error);
    router.back();
  }
};

// 更新账单方法
const updateThisRenewBill = async () => {
  try {
    // 构造更新数据
    const updateData = {
      id: billForm.value.id,
      name: billForm.value.name,
      cost: Number(billForm.value.cost),
      categoryId: Number(billForm.value.categoryId),
      cycle: billForm.value.cycle,
      beginning: billForm.value.beginning,
      ending: billForm.value.ending,
      details: billForm.value.details,
      renew: billForm.value.renew,
      isDeleted: "正常",
    };

    // 调用更新 API
    await updateRenewBill(updateData);

    // 清理本地存储并返回
    localStorage.removeItem("currentRenewBill");
    router.back();
  } catch (error: any) {
    ElMessage({
      message: error.message || "更新失败，请稍后重试",
      type: "error",
      plain: true,
    });
  }
};

// 删除账单处理函数
const deleteThisRenewBill = async () => {
  try {
    const confirmed = await showConfirmDialog({
      title: "确认删除",
      message: "是否确认删除该循环账单？",
      showCancelButton: true,
      width: "20rem",
      confirmButtonColor: "#ff7875",
    }).catch(() => false);

    if (!confirmed) return;

    // 将当前账单 id 放入数组
    const renewBillIds = [billForm.value.id];

    // 调用删除 API
    await deleteRenewBill(renewBillIds);

    // 清理本地存储并返回
    localStorage.removeItem("currentRenewBill");
    router.back();
  } catch (error: any) {
    ElMessage({
      message: error.message || "删除失败，请稍后重试",
      type: "error",
      plain: true,
    });
  }
};

onMounted(() => {
  initCategories();
  initBillData();
});

onUnmounted(() => {
  localStorage.removeItem("currentRenewBill");
});
</script>

<style scoped>
.edit-renew-bill {
  height: 90vh;
}

.van-form {
  margin-top: 1rem;
}
</style>
