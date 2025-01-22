import axiosInstance from "@/utils/axios";

//统一响应类R的数据类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

//获取常规账单返回的数据模板
interface BillsResponse {
  id: number;
  amount: number;
  type: string;
  categoryId: string;

  detail: string;
  date: Date;
}
