<template>
  <div class="bill-container">
    <!-- 顶部控制区域 -->
    <div class="header-container">
      <div class="title-section">
        <h1>我的账单</h1>
        <div class="date-selector">
          <!-- 确保 el-config-provider 包裹了日期选择器 -->
          <el-config-provider :locale="zhCn">
            <el-date-picker
              v-model="dateValue"
              type="month"
              format="YYYY年MM月"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
              placeholder="选择月份"
              :shortcuts="[]"
              :teleported="false"
            />
          </el-config-provider>
        </div>
      </div>
      <div class="summary-cards">
        <el-card class="summary-card income">
          <div class="card-content">
            <div class="card-title">本月收入</div>
            <div class="card-amount">¥{{ MonthEarn.toFixed(2) }}</div>
          </div>
        </el-card>
        <el-card class="summary-card expense">
          <div class="card-content">
            <div class="card-title">本月支出</div>
            <div class="card-amount">¥{{ MonthCost.toFixed(2) }}</div>
          </div>
        </el-card>
        <el-card class="summary-card balance">
          <div class="card-content">
            <div class="card-title">本月结余</div>
            <div class="card-amount">
              ¥{{ (MonthEarn - MonthCost).toFixed(2) }}
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 账单列表区域 -->
    <div class="bills-container">
      <div class="bills-header">
        <h2>账单明细</h2>
        <el-button type="primary" @click="addNewBill">
          <el-icon><plus /></el-icon>添加账单
        </el-button>
      </div>

      <!-- 修改表格，使用点击行切换展开/收起方式 -->
      <el-table
        v-loading="loading"
        :data="groupedBills"
        style="width: 100%"
        row-key="date"
        :expand-row-keys="expandedRows"
        @row-click="handleRowClick"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="day-bills">
              <el-table :data="props.row.items" style="width: 100%">
                <el-table-column prop="categoryName" label="分类" width="140" />
                <el-table-column prop="detail" label="备注" min-width="200" />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="scope.row.type === '收入' ? 'success' : 'danger'"
                    >
                      {{ scope.row.type }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="scope">
                    <span
                      :class="
                        scope.row.type === '收入'
                          ? 'income-text'
                          : 'expense-text'
                      "
                    >
                      {{ scope.row.type === "收入" ? "+" : "-" }} ¥{{
                        scope.row.amount.toFixed(2)
                      }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default="scope">
                    <el-button size="small" @click="editBill(scope.row)"
                      >编辑</el-button
                    >
                    <el-button
                      size="small"
                      type="danger"
                      @click="deleteBill(scope.row)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="日期" width="150">
          <template #default="scope">
            <div class="date-column">
              <span class="date-text">{{ formatDate(scope.row.date) }}</span>
              <span class="day-of-week">{{
                getDayOfWeek(scope.row.date)
              }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收支" min-width="200">
          <template #default="scope">
            <div class="summary-row">
              <span class="income-text"
                >收入: ¥{{ getDayTotal(scope.row.date, "收入") }}</span
              >
              <span class="expense-text"
                >支出: ¥{{ getDayTotal(scope.row.date, "支出") }}</span
              >
              <span class="balance-text">
                结余: ¥{{
                  (
                    getDayTotal(scope.row.date, "收入") -
                    getDayTotal(scope.row.date, "支出")
                  ).toFixed(2)
                }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
        v-if="bills.length === 0 && !loading"
        description="没有找到账单记录"
      >
        <el-button type="primary" @click="addNewBill">添加账单</el-button>
      </el-empty>
    </div>

    <!-- 编辑/添加账单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加账单' : '编辑账单'"
      width="500px"
    >
      <el-form
        ref="billFormRef"
        :model="billForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="billForm.type">
            <el-radio label="支出">支出</el-radio>
            <el-radio label="收入">收入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input
            v-model.number="billForm.amount"
            type="number"
            placeholder="请输入金额"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select
            v-model="billForm.categoryId"
            placeholder="请选择分类"
            filterable
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-config-provider>
            <el-date-picker
              v-model="billForm.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :shortcuts="dateShortcuts"
            />
          </el-config-provider>
        </el-form-item>
        <el-form-item label="备注" prop="detail">
          <el-input
            v-model="billForm.detail"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            {{ dialogType === "add" ? "添加" : "保存" }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  getMonthBills,
  addBill,
  updateBill,
  deleteBill as deleteBillApi,
} from "@/api/bill";
import { getAllCategories } from "@/api/category";
import { ElMessage, ElMessageBox, ElConfigProvider } from "element-plus";
import zhCn from "element-plus/dist/locale/zh-cn.mjs"; // 确保导入
import { Plus } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(false);
const bills = ref<any[]>([]);
const categories = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogType = ref("add"); // 'add' 或 'edit'
const MonthCost = ref(0);
const MonthEarn = ref(0);

// 添加展开行的控制
const expandedRows = ref<string[]>([]);

// 添加点击行切换展开状态的处理函数
const handleRowClick = (row: any) => {
  const isExpanded = expandedRows.value.includes(row.date);

  if (isExpanded) {
    // 如果行已展开，则收起
    expandedRows.value = [];
  } else {
    // 如果行未展开，则展开
    expandedRows.value = [row.date];
  }
};

// 保留原handleExpandChange作为备份
const handleExpandChange = (row: any, expandedStatus: boolean) => {
  console.log("Row expand change:", row.date, expandedStatus);

  if (expandedStatus) {
    expandedRows.value = [row.date];
  } else {
    expandedRows.value = [];
  }
};

// 当前选择的日期
const dateValue = ref(new Date());
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// 移除快捷方式
// 只在表单内的日期选择器保留快捷方式
const dateShortcuts = [
  {
    text: "今天",
    value: new Date(),
  },
  {
    text: "昨天",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24);
      return date;
    },
  },
  {
    text: "一周前",
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
      return date;
    },
  },
];

// 账单表单相关数据
const billFormRef = ref();
const billForm = ref({
  id: 0,
  type: "支出",
  amount: "",
  categoryId: "",
  date: new Date().toISOString().split("T")[0],
  detail: "",
});

// 表单验证规则
const rules = {
  type: [{ required: true, message: "请选择账单类型", trigger: "change" }],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", message: "金额必须为数字", trigger: "blur" },
    {
      validator: (
        rule: any,
        value: number,
        callback: (arg0: Error | undefined) => void
      ) => {
        if (value <= 0) {
          callback(new Error("金额必须大于0"));
        } else if (value >= 100000000) {
          callback(new Error("金额不能超过1亿"));
        } else {
          callback(undefined);
        }
      },
      trigger: "blur",
    },
  ],
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  date: [{ required: true, message: "请选择日期", trigger: "change" }],
  detail: [{ max: 100, message: "备注不能超过100个字符", trigger: "blur" }],
};

// 分类选项，根据当前选择的账单类型筛选
const categoryOptions = computed(() => {
  return categories.value.filter(
    (cat) => cat.categoryType === billForm.value.type
  );
});

// 按日期分组的账单数据
const groupedBills = computed(() => {
  const grouped: Record<string, { date: string; items: any[] }> = {};
  bills.value.forEach((bill) => {
    if (!grouped[bill.date]) {
      grouped[bill.date] = {
        date: bill.date,
        items: [],
      };
    }
    grouped[bill.date].items.push(bill);
  });

  // 转换为数组并按日期降序排序
  return Object.values(grouped).sort((a: any, b: any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

// 监听账单类型变化，重置分类选择
watch(
  () => billForm.value.type,
  () => {
    billForm.value.categoryId = "";
  }
);

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 获取星期几
const getDayOfWeek = (dateStr: string) => {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

// 计算指定日期的收支总额
const getDayTotal = (date: string, type: string) => {
  return bills.value
    .filter((bill) => bill.date === date && bill.type === type)
    .reduce((sum, bill) => sum + bill.amount, 0)
    .toFixed(2);
};

// 处理日期变化
const handleDateChange = () => {
  if (dateValue.value) {
    const date = new Date(dateValue.value);
    currentYear.value = date.getFullYear();
    currentMonth.value = date.getMonth() + 1;
    fetchBillData();
  }
};

// 获取账单数据
const fetchBillData = async () => {
  loading.value = true;
  try {
    // 获取指定月份的账单数据
    await getMonthBills(currentMonth.value, currentYear.value);

    // 从localStorage读取处理后的数据
    const storedBills = localStorage.getItem("bills");
    const storedCategories = localStorage.getItem("categories");

    if (storedBills && storedCategories) {
      const billsData = JSON.parse(storedBills);
      const categoriesData = JSON.parse(storedCategories);

      // 处理账单数据，添加分类名称
      bills.value = billsData
        .map((bill: any) => ({
          ...bill,
          categoryName:
            categoriesData.find((cat: any) => cat.id === bill.categoryId)
              ?.name || "未知分类",
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      // 计算月度收支总额
      MonthCost.value = bills.value
        .filter((bill) => bill.type === "支出")
        .reduce((sum, bill) => sum + bill.amount, 0);
      MonthEarn.value = bills.value
        .filter((bill) => bill.type === "收入")
        .reduce((sum, bill) => sum + bill.amount, 0);
    }

    // 重置展开行状态
    expandedRows.value = [];
  } catch (error: any) {
    console.error("获取账单失败:", error);
    ElMessage({
      message: "获取账单失败: " + error.message,
      type: "error",
      customClass: "small-message",
    });
  } finally {
    loading.value = false;
  }
};

// 获取分类数据
const fetchCategoryData = async () => {
  try {
    await getAllCategories();
    const storedCategories = localStorage.getItem("categories");
    if (storedCategories) {
      categories.value = JSON.parse(storedCategories);
    }
  } catch (error: any) {
    console.error("获取分类失败:", error);
    ElMessage({
      message: "获取分类失败: " + error.message,
      type: "error",
    });
  }
};

// 添加新账单
const addNewBill = () => {
  dialogType.value = "add";
  billForm.value = {
    id: 0,
    type: "支出",
    amount: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    detail: "",
  };
  dialogVisible.value = true;
};

// 编辑账单
const editBill = (row: any) => {
  dialogType.value = "edit";
  billForm.value = {
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.categoryId,
    date: row.date,
    detail: row.detail,
  };
  dialogVisible.value = true;
};

// 删除账单
const deleteBill = (row: any) => {
  ElMessageBox.confirm("确定要删除这条账单记录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await deleteBillApi([row.id]);
        ElMessage({
          message: "删除成功",
          type: "success",
        });
        fetchBillData(); // 重新获取账单数据
      } catch (error: any) {
        ElMessage({
          message: "删除失败: " + error.message,
          type: "error",
        });
      }
    })
    .catch(() => {});
};

// 提交表单
const submitForm = () => {
  billFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const submitData = {
          ...billForm.value,
          amount: Number(billForm.value.amount),
          categoryId: Number(billForm.value.categoryId),
        };

        if (dialogType.value === "add") {
          await addBill({
            amount: submitData.amount,
            categoryId: submitData.categoryId,
            date: submitData.date,
            detail: submitData.detail,
            billType: submitData.type,
          });
          ElMessage({
            message: "添加成功",
            type: "success",
          });
        } else {
          await updateBill(submitData);
          ElMessage({
            message: "更新成功",
            type: "success",
          });
        }

        dialogVisible.value = false;
        fetchBillData(); // 重新获取账单数据
      } catch (error: any) {
        ElMessage({
          message:
            dialogType.value === "add"
              ? "添加失败: "
              : "更新失败: " + error.message,
          type: "error",
        });
      }
    }
  });
};

// 生命周期钩子
onMounted(async () => {
  await fetchCategoryData();
  await fetchBillData();
});
</script>

<style scoped>
.bill-container {
  padding: 0px 20px 0px; /* 修改上部内边距从20px减小到10px */
  max-width: 1200px;
  margin: 0 auto;
}

.header-container {
  margin-bottom: 20px; /* 可以同时减小与下方内容的间距，从30px减小到20px */
}

.title-section {
  display: flex;
  justify-content: space-between; /* 修改为space-between，与renewbill保持一致 */
  align-items: center;
  margin-bottom: 20px; /* 添加底部间距，保持与renewbill一致 */
}

.title-section h1 {
  margin: 0; /* 移除 h1 的默认外边距 */
  color: #333;
  font-size: 24px;
}

.date-selector {
  width: 180px;
}

/* ... 其他样式 ... */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  flex: 1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 5px;
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.card-amount {
  font-size: 24px;
  font-weight: bold;
}

.income .card-amount {
  color: #67c23a;
}

.expense .card-amount {
  color: #f56c6c;
}

.balance .card-amount {
  color: #409eff;
}

.bills-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.bills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.bills-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.day-bills {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.date-column {
  display: flex;
  flex-direction: column;
}

.date-text {
  font-weight: bold;
  color: #333;
}

.day-of-week {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.income-text {
  color: #67c23a;
  font-weight: bold;
}

.expense-text {
  color: #f56c6c;
  font-weight: bold;
}

.balance-text {
  color: #409eff;
  font-weight: bold;
}
</style>
