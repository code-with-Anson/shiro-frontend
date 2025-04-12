<template>
  <div class="renew-bill-container">
    <!-- 顶部控制区域 -->
    <div class="header-container">
      <div class="title-section">
        <h1>循环账单</h1>
        <div class="actions">
          <el-button type="primary" @click="addNewRenewBill">
            <el-icon><plus /></el-icon>添加循环账单
          </el-button>
          <el-button @click="editCategories">
            <el-icon><edit /></el-icon>编辑分类
          </el-button>
        </div>
      </div>
    </div>

    <!-- 循环账单列表区域 -->
    <div class="bills-container">
      <el-tabs type="card" v-model="activeCategory" class="category-tabs">
        <el-tab-pane label="全部" name="all">
          <div class="category-bills">
            <el-empty
              v-if="!renewBills.records.length && !loading"
              description="没有找到循环账单记录"
            >
              <el-button type="primary" @click="addNewRenewBill"
                >添加循环账单</el-button
              >
            </el-empty>

            <el-card
              v-else
              v-loading="loading"
              shadow="hover"
              class="bill-card"
              v-for="bill in renewBills.records"
              :key="bill.id"
            >
              <div class="bill-header">
                <div class="bill-title">
                  <span class="bill-name">{{ bill.name }}</span>
                  <el-tag size="small" effect="plain" type="success">{{
                    bill.cycle
                  }}</el-tag>
                  <el-tag size="small" effect="plain" type="warning"
                    >¥{{ bill.cost }}</el-tag
                  >
                </div>
                <div class="bill-category">
                  {{ getCategoryName(bill.categoryId) }}
                </div>
              </div>

              <div class="bill-content">
                <div class="bill-periods">
                  <div class="period-item">
                    <span class="period-label">日付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "day") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">周付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "week") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">月付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "month") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">年付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "year") }}</span
                    >
                  </div>
                </div>

                <div class="bill-details">
                  <div class="detail-item">
                    <span class="detail-label">开始日期</span>
                    <span class="detail-value">{{ bill.beginning }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">结束日期</span>
                    <span class="detail-value">{{ bill.ending }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">自动续费</span>
                    <el-switch
                      v-model="bill.renewStatus"
                      @change="(val: boolean) => updateRenewStatus(val, bill)"
                      active-color="#39c5bb"
                      inactive-color="#dcdee0"
                    />
                  </div>
                </div>

                <div class="bill-description" v-if="bill.details">
                  <span class="description-label">备注：</span>
                  <span class="description-value">{{ bill.details }}</span>
                </div>
              </div>

              <div class="bill-actions">
                <el-button size="small" @click="editRenewBill(bill)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteRenewBill(bill)"
                  >删除</el-button
                >
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane
          v-for="category in renewCategories"
          :key="category.id"
          :label="category.name"
          :name="category.id"
        >
          <div class="category-bills">
            <el-empty
              v-if="!getBillsByCategory(category.id).length"
              :description="`没有找到${category.name}分类的循环账单`"
            >
              <el-button type="primary" @click="addNewRenewBill"
                >添加循环账单</el-button
              >
            </el-empty>

            <el-card
              v-else
              v-for="bill in getBillsByCategory(category.id)"
              :key="bill.id"
              shadow="hover"
              class="bill-card"
            >
              <div class="bill-header">
                <div class="bill-title">
                  <span class="bill-name">{{ bill.name }}</span>
                  <el-tag size="small" effect="plain" type="success">{{
                    bill.cycle
                  }}</el-tag>
                  <el-tag size="small" effect="plain" type="warning"
                    >¥{{ bill.cost }}</el-tag
                  >
                </div>
              </div>

              <div class="bill-content">
                <div class="bill-periods">
                  <div class="period-item">
                    <span class="period-label">日付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "day") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">周付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "week") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">月付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "month") }}</span
                    >
                  </div>
                  <div class="period-item">
                    <span class="period-label">年付费用</span>
                    <span class="period-value"
                      >¥{{ calculatePeriodCost(bill, "year") }}</span
                    >
                  </div>
                </div>

                <div class="bill-details">
                  <div class="detail-item">
                    <span class="detail-label">开始日期</span>
                    <span class="detail-value">{{ bill.beginning }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">结束日期</span>
                    <span class="detail-value">{{ bill.ending }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">自动续费</span>
                    <el-switch
                      v-model="bill.renewStatus"
                      @change="(val: boolean) => updateRenewStatus(val, bill)"
                      active-color="#39c5bb"
                      inactive-color="#dcdee0"
                    />
                  </div>
                </div>

                <div class="bill-description" v-if="bill.details">
                  <span class="description-label">备注</span>
                  <span class="description-value">{{ bill.details }}</span>
                </div>
              </div>

              <div class="bill-actions">
                <el-button size="small" @click="editRenewBill(bill)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteRenewBill(bill)"
                  >删除</el-button
                >
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑/添加循环账单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加循环账单' : '编辑循环账单'"
      width="500px"
    >
      <el-form
        ref="renewBillFormRef"
        :model="renewBillForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="账单名称" prop="name">
          <el-input
            v-model="renewBillForm.name"
            placeholder="请输入账单名称"
            clearable
          ></el-input>
        </el-form-item>

        <el-form-item label="金额" prop="cost">
          <el-input
            v-model.number="renewBillForm.cost"
            type="number"
            placeholder="请输入金额"
            clearable
          ></el-input>
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select
            v-model="renewBillForm.categoryId"
            placeholder="请选择分类"
            filterable
          >
            <el-option
              v-for="item in renewCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="付款周期" prop="cycle">
          <el-select v-model="renewBillForm.cycle" placeholder="请选择付款周期">
            <el-option label="日付" value="日付" />
            <el-option label="周付" value="周付" />
            <el-option label="月付" value="月付" />
            <el-option label="年付" value="年付" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始日期" prop="beginning">
          <el-date-picker
            v-model="renewBillForm.beginning"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期" prop="ending">
          <el-date-picker
            v-model="renewBillForm.ending"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="自动续费" prop="renew">
          <el-radio-group v-model="renewBillForm.renew">
            <el-radio label="开启">开启</el-radio>
            <el-radio label="未开启">未开启</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注" prop="details">
          <el-input
            v-model="renewBillForm.details"
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

    <!-- 分类管理对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      title="管理循环账单分类"
      width="500px"
    >
      <div class="category-dialog-content">
        <!-- 分类列表 -->
        <div class="categories-list">
          <el-table :data="renewCategories" style="width: 100%">
            <el-table-column prop="name" label="分类名称" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="startEditCategory(scope.row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="confirmDeleteCategory(scope.row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 添加分类按钮 -->
        <div class="add-category-section">
          <el-button type="primary" @click="startAddCategory">
            <el-icon><Plus /></el-icon>添加新分类
          </el-button>
        </div>

        <!-- 添加/编辑分类表单 -->
        <div v-if="currentAction" class="category-form">
          <h3>{{ currentAction === "add" ? "添加分类" : "编辑分类" }}</h3>
          <el-form @submit.prevent="submitCategoryForm">
            <el-form-item>
              <el-input
                v-model="newCategoryName"
                placeholder="请输入分类名称"
                maxlength="10"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="cancelCategoryAction">取消</el-button>
              <el-button type="primary" @click="submitCategoryForm">
                {{ currentAction === "add" ? "添加" : "保存" }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit } from "@element-plus/icons-vue";
import {
  getRenewBills,
  updateAutoRenewStatus,
  addRenewBill,
  updateRenewBill,
  deleteRenewBill as deleteRenewBillApi,
} from "@/api/renew_bill";
import {
  getAllRenewCategories,
  deleteRenewCategory,
  updateRenewCategory,
  addNewCategory,
} from "@/api/renew_category";

// 定义接口
interface RenewBillRecord {
  id: number;
  name: string;
  details: string;
  categoryId: number;
  cycle: string;
  beginning: string;
  ending: string;
  renew: string;
  cost: number;
  renewStatus?: boolean; // 用于UI显示
}

interface RenewBill {
  records: RenewBillRecord[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

interface RenewCategory {
  id: string;
  name: string;
}

// 声明状态变量
const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const activeCategory = ref("all");

// 分类编辑相关
const showCategoryDialog = ref(false);
const newCategoryName = ref("");
const editingCategoryId = ref("");
const currentAction = ref<"add" | "edit" | "">("");

// 循环账单和分类数据
const renewBills = ref<RenewBill>({
  records: [],
  total: 0,
  size: 0,
  current: 1,
  pages: 0,
});

const renewCategories = ref<RenewCategory[]>([]);

// 表单相关数据
const renewBillFormRef = ref();
const renewBillForm = ref({
  id: 0,
  name: "",
  cost: 0, // 使用明确的数字类型作为初始值，而不是 undefined
  categoryId: "",
  cycle: "月付",
  beginning: new Date().toISOString().split("T")[0],
  ending: new Date().toISOString().split("T")[0],
  details: "",
  renew: "未开启",
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入账单名称", trigger: "blur" },
    { min: 1, max: 20, message: "长度在1到20个字符之间", trigger: "blur" },
  ],
  cost: [
    { required: true, message: "请输入金额", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        // 首先确保转换为数字
        const numValue = Number(value);

        if (isNaN(numValue)) {
          callback(new Error("金额必须为数字"));
        } else if (numValue <= 0) {
          callback(new Error("金额必须大于0"));
        } else if (numValue >= 1000000) {
          callback(new Error("金额不能超过100万"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  cycle: [{ required: true, message: "请选择付款周期", trigger: "change" }],
  beginning: [{ required: true, message: "请选择开始日期", trigger: "change" }],
  ending: [{ required: true, message: "请选择结束日期", trigger: "change" }],
};

// 获取循环账单数据
const fetchRenewBills = async () => {
  loading.value = true;
  try {
    const response = await getRenewBills();
    renewBills.value = response;

    // 添加UI显示所需的状态
    renewBills.value.records.forEach((bill) => {
      bill.renewStatus = bill.renew === "开启";
    });
  } catch (error: any) {
    console.error("获取循环账单失败:", error);
    ElMessage({
      message: "获取循环账单失败: " + error.message,
      type: "error",
      customClass: "small-message",
    });
  } finally {
    loading.value = false;
  }
};

// 获取分类数据
const fetchCategories = async () => {
  try {
    await getAllRenewCategories();
    const storedRenewCategories = localStorage.getItem("RenewCategories");
    if (storedRenewCategories) {
      renewCategories.value = JSON.parse(storedRenewCategories);
    }
  } catch (error: any) {
    console.error("获取分类失败:", error);
    ElMessage({
      message: "获取分类失败: " + error.message,
      type: "error",
      customClass: "small-message",
    });
  }
};

// 按分类过滤账单
const getBillsByCategory = (categoryId: string) => {
  return renewBills.value.records.filter(
    (bill) => bill.categoryId.toString() === categoryId
  );
};

// 计算不同周期的费用
const calculatePeriodCost = (
  bill: RenewBillRecord,
  period: "day" | "week" | "month" | "year"
) => {
  const startDate = new Date(bill.beginning);
  const endDate = new Date(bill.ending);
  const totalCost = bill.cost;

  // 计算总天数差
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 0) return 0;

  // 计算每天的成本
  const costPerDay = totalCost / daysDiff;

  // 根据周期返回对应的费用
  const costs = {
    day: costPerDay,
    week: costPerDay * 7,
    month: costPerDay * 30,
    year: costPerDay * 365,
  };

  return Number(costs[period].toFixed(2));
};

// 获取分类名称
const getCategoryName = (categoryId: number) => {
  const category = renewCategories.value.find(
    (cat) => cat.id === categoryId.toString()
  );
  return category ? category.name : "未分类";
};

// 更新自动续费状态
const updateRenewStatus = (value: boolean, bill: RenewBillRecord) => {
  ElMessageBox.confirm(`是否${value ? "开启" : "关闭"}自动续费？`, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        const renewStatus = value ? "开启" : "未开启";
        await updateAutoRenewStatus(bill.id, renewStatus, false); // 传入false禁用API消息提示
        bill.renew = renewStatus;

        ElMessage({
          message: "更新续费状态成功",
          type: "success",
          customClass: "small-message",
        });
      } catch (error: any) {
        console.error("更新续费状态失败:", error);
        ElMessage({
          message: "更新续费状态失败: " + error.message,
          type: "error",
          customClass: "small-message",
        });
        // 恢复原状态
        bill.renewStatus = !value;
      }
    })
    .catch(() => {
      // 用户取消操作，恢复原状态
      bill.renewStatus = !value;
    });
};

// 添加新账单
const addNewRenewBill = () => {
  dialogType.value = "add";
  renewBillForm.value = {
    id: 0,
    name: "",
    cost: 0, // 使用明确的数字类型作为初始值，而不是 undefined
    categoryId: "",
    cycle: "月付",
    beginning: new Date().toISOString().split("T")[0],
    ending: new Date().toISOString().split("T")[0],
    details: "",
    renew: "未开启",
  };
  dialogVisible.value = true;
};

// 编辑账单
const editRenewBill = (bill: RenewBillRecord) => {
  dialogType.value = "edit";
  renewBillForm.value = {
    id: bill.id,
    name: bill.name,
    cost: bill.cost,
    categoryId: bill.categoryId.toString(),
    cycle: bill.cycle,
    beginning: bill.beginning,
    ending: bill.ending,
    details: bill.details,
    renew: bill.renew,
  };
  dialogVisible.value = true;
};

// 提交账单表单
const submitForm = async () => {
  if (!renewBillFormRef.value) return;

  await renewBillFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // Ensure categoryId is a number before sending
        const formData = {
          ...renewBillForm.value,
          categoryId: parseInt(renewBillForm.value.categoryId, 10),
        };

        if (dialogType.value === "add") {
          await addRenewBill(formData);
          ElMessage({
            message: "添加循环账单成功",
            type: "success",
            customClass: "small-message",
          });
        } else {
          await updateRenewBill(formData);
          ElMessage({
            message: "更新循环账单成功",
            type: "success",
            customClass: "small-message",
          });
        }

        dialogVisible.value = false;
        fetchRenewBills(); // 刷新账单列表
      } catch (error: any) {
        ElMessage({
          message: `${
            dialogType.value === "add" ? "添加" : "更新"
          }循环账单失败: ${error.message}`,
          type: "error",
          customClass: "small-message",
        });
      }
    }
  });
};

// 删除账单
const deleteRenewBill = (bill: RenewBillRecord) => {
  ElMessageBox.confirm("确定要删除这条循环账单吗？", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await deleteRenewBillApi([bill.id], false); // 传入false禁用API消息提示
        ElMessage({
          message: "删除成功",
          type: "success",
          customClass: "small-message",
        });
        fetchRenewBills(); // 重新获取账单数据
      } catch (error: any) {
        ElMessage({
          message: "删除失败: " + error.message,
          type: "error",
          customClass: "small-message",
        });
      }
    })
    .catch(() => {});
};

// 编辑分类
const editCategories = () => {
  // 重置编辑状态
  editingCategoryId.value = "";
  newCategoryName.value = "";
  currentAction.value = "";

  // 显示对话框
  showCategoryDialog.value = true;
};

// 开始添加分类
const startAddCategory = () => {
  newCategoryName.value = "";
  currentAction.value = "add";
};

// 开始编辑分类
const startEditCategory = (category: RenewCategory) => {
  editingCategoryId.value = category.id;
  newCategoryName.value = category.name;
  currentAction.value = "edit";
};

// 取消当前操作
const cancelCategoryAction = () => {
  currentAction.value = "";
  newCategoryName.value = "";
  editingCategoryId.value = "";
};

// 确认删除分类
const confirmDeleteCategory = (category: RenewCategory) => {
  ElMessageBox.confirm(
    "删除循环账单分类时，会将对应的循环账单一起删除，是否删除？",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        await deleteRenewCategory([parseInt(category.id)]);
        await fetchCategories(); // 重新获取分类数据
        await fetchRenewBills(); // 重新获取账单数据

        ElMessage({
          message: "删除分类成功",
          type: "success",
          customClass: "small-message",
        });
      } catch (error: any) {
        ElMessage({
          message: "删除分类失败: " + error.message,
          type: "error",
          customClass: "small-message",
        });
      }
    })
    .catch(() => {
      // 用户取消删除操作
    });
};

// 提交分类表单
const submitCategoryForm = async () => {
  if (!newCategoryName.value.trim()) {
    ElMessage({
      message: "分类名称不能为空",
      type: "warning",
      customClass: "small-message",
    });
    return;
  }

  // Store the action type before the try block
  const action = currentAction.value;

  try {
    if (action === "add") {
      // 添加新分类
      await addNewCategory(newCategoryName.value);
    } else if (action === "edit") {
      // 编辑现有分类
      await updateRenewCategory(editingCategoryId.value, newCategoryName.value);
    } else {
      // Handle unexpected action type if necessary
      console.error("Unexpected action type:", action);
      return;
    }

    // 重新获取分类数据
    await fetchCategories();

    // 重置表单状态
    currentAction.value = "";
    newCategoryName.value = "";
    editingCategoryId.value = "";

    ElMessage({
      message: action === "add" ? "添加分类成功" : "编辑分类成功",
      type: "success",
      customClass: "small-message",
    });
  } catch (error: any) {
    ElMessage({
      message: `${action === "add" ? "添加" : "编辑"}分类失败: ${
        error.message
      }`,
      type: "error",
      customClass: "small-message",
    });
  }
};

// 初始化数据
onMounted(async () => {
  await fetchCategories();
  await fetchRenewBills();
});
</script>

<style scoped>
.renew-bill-container {
  padding: 0px 20px 0px; /* 修改为与bill.vue一致的padding */
  max-width: 1200px;
  margin: 0 auto;
}

.header-container {
  margin-bottom: 20px; /* 减小与bill.vue一致 */
}

.title-section {
  display: flex;
  justify-content: space-between; /* 保持不变 */
  align-items: center;
  margin-bottom: 20px; /* 保持不变 */
}

.title-section h1 {
  margin: 0; /* 确保h1没有边距，与bill.vue一致 */
  color: #333;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.bills-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.category-tabs {
  width: 100%;
}

.category-bills {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 修改为固定3列布局 */
  gap: 15px; /* 减小卡片间距 */
}

.bill-card {
  transition: all 0.3s ease;
  padding: 0; /* 移除默认内边距 */
}

/* 修改卡片内部内边距，使其更紧凑 */
.bill-card :deep(.el-card__body) {
  padding: 12px;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; /* 减小底部间距 */
}

.bill-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bill-name {
  font-size: 16px; /* 减小标题字体 */
  font-weight: bold;
  color: #333;
}

.bill-category {
  color: #666;
  font-size: 12px; /* 减小分类字体 */
}

.bill-content {
  margin-bottom: 15px;
}

.bill-periods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px; /* 减小间距 */
  margin-bottom: 12px;
  background-color: #f9f9f9;
  padding: 8px;
  border-radius: 4px;
}

.period-item {
  display: flex;
  flex-direction: column;
}

.period-label {
  font-size: 12px; /* 减小标签字体 */
  color: #666;
}

.period-value {
  font-size: 14px; /* 减小金额字体 */
  color: #39c5bb;
  font-weight: bold;
}

.bill-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px; /* 减小间距 */
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 12px; /* 减小标签字体 */
  color: #666;
}

.detail-value {
  color: #333;
  font-size: 12px; /* 明确设置详情字体大小 */
}

.bill-description {
  background-color: #f9f9f9;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 12px; /* 设置说明字体 */
}

.description-label {
  font-size: 12px; /* 减小标签字体 */
  color: #666;
  margin-bottom: 3px;
}

.description-value {
  color: #333;
  word-break: break-word;
  font-size: 12px; /* 设置说明内容字体 */
}

.bill-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px; /* 减小按钮间距 */
}

.bill-actions .el-button {
  padding: 7px 12px; /* 调整按钮大小 */
}

/* 分类管理对话框样式 */
.category-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.categories-list {
  max-height: 300px;
  overflow-y: auto;
}

.add-category-section {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.category-form {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.category-form h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
}

@media (max-width: 1200px) {
  .category-bills {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .category-bills {
    grid-template-columns: 1fr;
  }

  .bill-details {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
