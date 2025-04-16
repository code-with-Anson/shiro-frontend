import axiosInstance from "@/utils/axios";
import { getMonthBills } from "./bill";

// 统计响应接口
interface StatisticsResponse {
  totalExpense: number;
  totalIncome: number;
  netIncome: number;
  categoryDetails?: Record<string, number>;
  expenseCategoryDetails?: Record<string, number>;
  incomeCategoryDetails?: Record<string, number>;
}

// 周统计响应接口
interface WeekStatisticsResponse extends StatisticsResponse {
  dailyData: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

// 月统计响应接口
interface MonthStatisticsResponse extends StatisticsResponse {
  billCount: number;
  year: number;
  month: number;
  dailyData?: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

// 年统计响应接口
interface YearStatisticsResponse extends StatisticsResponse {
  billCount: number;
  year: number;
  monthDetails: Array<{
    month: number;
    income: number;
    expense: number;
    netIncome?: number;
    billCount?: number;
  }>;
}

/**
 * 获取一周的账单统计数据
 * @returns Promise<WeekStatisticsResponse>
 */
export async function getWeekStatistics(): Promise<WeekStatisticsResponse> {
  try {
    // 获取当前日期
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // 获取当月所有账单
    const bills = await getMonthBills(month, year);

    // 计算过去7天的日期范围
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); // 过去6天 + 今天 = 7天

    // 过滤出最近7天的账单
    const weekBills = bills.filter((bill) => {
      const billDate = new Date(bill.date);
      return billDate >= oneWeekAgo && billDate <= today;
    });

    // 计算每日收支数据
    const dailyData: Array<{ date: string; income: number; expense: number }> =
      [];
    const expenseCategoryDetails: Record<string, number> = {};
    const incomeCategoryDetails: Record<string, number> = {};

    // 初始化过去7天的每一天数据
    for (let i = 0; i < 7; i++) {
      const date = new Date(oneWeekAgo);
      date.setDate(oneWeekAgo.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData.push({
        date: dateStr,
        income: 0,
        expense: 0,
      });
    }

    // 统计数据
    let totalExpense = 0;
    let totalIncome = 0;

    // 处理每一条账单
    const categoriesData = localStorage.getItem("categories");
    const categories = categoriesData ? JSON.parse(categoriesData) : [];

    weekBills.forEach((bill) => {
      const billDate = new Date(bill.date).toISOString().split("T")[0];
      const dailyItem = dailyData.find((item) => item.date === billDate);

      if (dailyItem) {
        if (bill.type === "支出") {
          dailyItem.expense += bill.amount;
          totalExpense += bill.amount;

          // 获取分类名称
          const category = categories.find(
            (cat: any) => cat.id === bill.categoryId
          );
          const categoryName = category ? category.name : "未分类";

          if (!expenseCategoryDetails[categoryName]) {
            expenseCategoryDetails[categoryName] = 0;
          }
          expenseCategoryDetails[categoryName] += bill.amount;
        } else {
          dailyItem.income += bill.amount;
          totalIncome += bill.amount;

          // 获取分类名称
          const category = categories.find(
            (cat: any) => cat.id === bill.categoryId
          );
          const categoryName = category ? category.name : "未分类";

          if (!incomeCategoryDetails[categoryName]) {
            incomeCategoryDetails[categoryName] = 0;
          }
          incomeCategoryDetails[categoryName] += bill.amount;
        }
      }
    });

    return {
      dailyData,
      totalExpense,
      totalIncome,
      netIncome: totalIncome - totalExpense,
      expenseCategoryDetails,
      incomeCategoryDetails,
      categoryDetails: { ...expenseCategoryDetails, ...incomeCategoryDetails },
    };
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("获取失败，请稍后重试");
    }
  }
}

/**
 * 获取月度账单统计数据
 * @param year 年份
 * @param month 月份
 * @returns Promise<MonthStatisticsResponse>
 */
export async function getMonthStatistics(
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
): Promise<MonthStatisticsResponse> {
  try {
    // 获取指定月份所有账单
    const bills = await getMonthBills(month, year);

    // 计算每日收支数据
    const dailyData: Array<{ date: string; income: number; expense: number }> =
      [];
    const expenseCategoryDetails: Record<string, number> = {};
    const incomeCategoryDetails: Record<string, number> = {};
    const dailyMap: Record<string, { income: number; expense: number }> = {};

    // 统计数据
    let totalExpense = 0;
    let totalIncome = 0;

    // 处理每一条账单
    const categoriesData = localStorage.getItem("categories");
    const categories = categoriesData ? JSON.parse(categoriesData) : [];

    bills.forEach((bill) => {
      const billDate = new Date(bill.date).toISOString().split("T")[0];

      if (!dailyMap[billDate]) {
        dailyMap[billDate] = { income: 0, expense: 0 };
      }

      if (bill.type === "支出") {
        dailyMap[billDate].expense += bill.amount;
        totalExpense += bill.amount;

        // 获取分类名称
        const category = categories.find(
          (cat: any) => cat.id === bill.categoryId
        );
        const categoryName = category ? category.name : "未分类";

        if (!expenseCategoryDetails[categoryName]) {
          expenseCategoryDetails[categoryName] = 0;
        }
        expenseCategoryDetails[categoryName] += bill.amount;
      } else {
        dailyMap[billDate].income += bill.amount;
        totalIncome += bill.amount;

        // 获取分类名称
        const category = categories.find(
          (cat: any) => cat.id === bill.categoryId
        );
        const categoryName = category ? category.name : "未分类";

        if (!incomeCategoryDetails[categoryName]) {
          incomeCategoryDetails[categoryName] = 0;
        }
        incomeCategoryDetails[categoryName] += bill.amount;
      }
    });

    // 转换每日数据为数组
    for (const [date, values] of Object.entries(dailyMap)) {
      dailyData.push({
        date,
        income: values.income,
        expense: values.expense,
      });
    }

    // 按日期排序
    dailyData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      billCount: bills.length,
      year,
      month,
      dailyData,
      totalExpense,
      totalIncome,
      netIncome: totalIncome - totalExpense,
      expenseCategoryDetails,
      incomeCategoryDetails,
      categoryDetails: { ...expenseCategoryDetails, ...incomeCategoryDetails },
    };
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.msg);
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error("获取失败，请稍后重试");
    }
  }
}

/**
 * 获取年度账单统计数据
 * @param year 年份
 * @returns Promise<YearStatisticsResponse>
 */
export async function getYearStatistics(
  year: number = new Date().getFullYear()
): Promise<YearStatisticsResponse> {
  try {
    // 使用新接口获取年度统计数据
    const response = await axiosInstance.post(
      "/bill-month-statistics/statistics",
      {
        year,
      }
    );

    console.log("年度统计API响应:", response.data);

    // 判断响应是否成功 (成功码包括20000和20039)
    // 使用字符串比较或Number转换后比较，确保类型一致
    if (
      response.data.code == 20000 ||
      response.data.code == 20039 ||
      response.data.code === "20000" ||
      response.data.code === "20039"
    ) {
      // 确保响应中有数据
      if (!response.data.data) {
        console.error("API返回成功但数据为空");
        throw new Error("返回的数据为空");
      }

      // 直接使用返回的数据，不在try-catch块中处理
      const data = response.data.data;

      console.log("开始格式化数据", {
        hasYear: !!data.year,
        hasTotalExpense: !!data.totalExpense,
        hasTotalIncome: !!data.totalIncome,
        hasMonthDetails: Array.isArray(data.monthDetails),
      });

      // 构造与前端接口匹配的数据结构
      const yearData: YearStatisticsResponse = {
        year: data.year || year, // 使用请求的年份作为后备
        totalExpense:
          typeof data.totalExpense === "number"
            ? data.totalExpense
            : Number(data.totalExpense || 0),
        totalIncome:
          typeof data.totalIncome === "number"
            ? data.totalIncome
            : Number(data.totalIncome || 0),
        netIncome:
          typeof data.netIncome === "number"
            ? data.netIncome
            : Number(data.netIncome || 0),
        billCount: data.billCount || 0,
        categoryDetails: data.categoryDetails || {},
        expenseCategoryDetails: data.expenseCategoryDetails || {},
        incomeCategoryDetails: data.incomeCategoryDetails || {},
        monthDetails: Array.isArray(data.monthDetails)
          ? data.monthDetails.map((item: any) => ({
              month: item.month,
              income: Number(item.income || 0),
              expense: Number(item.expense || 0),
              netIncome: Number(item.netIncome || 0),
              billCount: item.billCount || 0,
            }))
          : [],
      };

      console.log("处理后的年度数据:", yearData);
      return yearData;
    } else {
      // 服务器返回错误
      console.error(
        `服务器返回错误: 响应码=${response.data.code}, 消息=${response.data.msg}`
      );
      throw new Error(response.data.msg || "获取统计数据失败");
    }
  } catch (error: any) {
    console.error("年度统计API错误:", error);

    // 即使错误消息是"成功"，也不再抛出错误，而是返回一个默认的年度统计数据
    if (error.message === "成功") {
      console.warn("捕获到错误消息为'成功'的异常，返回默认数据");

      // 返回默认数据而不是抛出错误
      return {
        year: year,
        totalExpense: 0,
        totalIncome: 0,
        netIncome: 0,
        billCount: 0,
        categoryDetails: {},
        expenseCategoryDetails: {},
        incomeCategoryDetails: {},
        monthDetails: [],
      };
    }

    // 对于其他错误，继续抛出
    if (error.response?.data) {
      throw new Error(error.response.data.msg || "获取年度统计数据失败");
    } else if (error.request) {
      throw new Error("网络错误，请稍后重试");
    } else {
      throw new Error(error.message || "获取失败，请稍后重试");
    }
  }
}
