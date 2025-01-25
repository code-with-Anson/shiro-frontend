import COS from "cos-js-sdk-v5";
import axiosInstance from "@/utils/axios";
import { AxiosError } from "axios";
import { ElMessage } from "element-plus";

// 基础配置接口
interface COSConfig {
  SecretId: string;
  SecretKey: string;
  Bucket: string;
  Region: string;
}

// 合并后的选项接口
interface ImageHandlerOptions {
  maxSize?: number; // 最大文件大小(字节)
  maxWidth?: number; // 最大图片宽度
  maxHeight?: number; // 最大图片高度
  allowedTypes?: string[]; // 允许的文件类型
  onSuccess?: (imageUrl: string) => void; // 成功回调
  onError?: (error: Error) => void; // 错误回调
  onProgress?: (progress: number) => void; // 上传进度回调
  cosConfig: COSConfig; // COS配置
}

// 用户信息接口
interface UserInfo {
  userId: number;
  email: string;
  name: string;
  sex: string;
  avatar: string;
}

// 验证COS配置
const validateCOSConfig = (config: COSConfig): void => {
  const requiredFields = ["SecretId", "SecretKey", "Bucket", "Region"] as const;
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required COS configuration: ${field}`);
    }
  }
};

// 生成随机文件名
const generateRandomFileName = (originalName: string): string => {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const randomStr = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `avatar_${timestamp}_${randomStr}.${ext}`;
};

// 上传文件到腾讯云 COS
const uploadToCOS = async (
  file: File,
  fileName: string,
  cosConfig: COSConfig,
  onProgress?: (progress: number) => void
): Promise<string> => {
  validateCOSConfig(cosConfig);

  const cos = new COS({
    SecretId: cosConfig.SecretId,
    SecretKey: cosConfig.SecretKey,
  });

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: fileName,
        Body: file,
        onProgress: function (progressData) {
          const percent = Math.round(
            (progressData.loaded / progressData.total) * 100
          );
          onProgress?.(percent);
        },
      },
      function (err, data) {
        if (err) {
          reject(err);
        } else {
          const url = `https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${fileName}`;
          resolve(url);
        }
      }
    );
  });
};

// 调用后端接口
const updateBackend = async (imageUrl: string): Promise<UserInfo> => {
  try {
    const response = await axiosInstance.post<UserInfo>("/users/update-user", {
      avatar: imageUrl,
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.data) {
        throw new Error(error.response.data.msg || "头像更新失败");
      } else if (error.request) {
        throw new Error("网络错误，请稍后重试");
      }
    }
    throw error instanceof Error
      ? error
      : new Error("发生未知错误，请稍后重试");
  }
};

// 主处理函数
export const handleImageChange = async (
  event: Event,
  options: ImageHandlerOptions
) => {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = ["image/jpeg", "image/png", "image/gif"],
    onSuccess,
    onError,
    onProgress,
    cosConfig,
  } = options;

  // 确保event.target是HTMLInputElement
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  try {
    if (!file) {
      throw new Error("请选择图片文件");
    }

    // 验证文件类型
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `仅支持 ${allowedTypes
          .map((type) => type.split("/")[1])
          .join(", ")} 格式`
      );
    }

    // 验证文件大小
    if (file.size > maxSize) {
      throw new Error(`图片大小不能超过${Math.floor(maxSize / 1024 / 1024)}MB`);
    }

    // 验证图片尺寸
    // await validateImageDimensions(file, maxWidth, maxHeight);

    // 生成随机文件名
    const fileName = generateRandomFileName(file.name);

    // 上传到腾讯云 COS
    const imageUrl = await uploadToCOS(file, fileName, cosConfig, onProgress);

    // 调用后端接口更新头像URL
    const userInfo = await updateBackend(imageUrl);

    // 调用成功回调
    onSuccess?.(userInfo.avatar);
  } catch (error) {
    const err = error instanceof Error ? error : new Error("处理图片时出错");
    onError?.(err);
    if (!options.onError) {
      ElMessage({
        message: err.message,
        type: "error",
        plain: true,
      });
    }
    console.error("处理图片错误:", error);
  } finally {
    // 清理文件输入
    target.value = "";
  }
};

// 使用示例
/*
const handleAvatarChange = async (event: Event) => {
  await handleImageChange(event, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
    onSuccess: (imageUrl) => {
      console.log('上传成功，新的头像地址:', imageUrl);
      // 这里可以更新用户界面显示的头像
    },
    onError: (error) => {
      console.error('上传失败:', error);
    },
    onProgress: (progress) => {
      console.log('上传进度:', progress);
    },
    cosConfig: {
      SecretId: 'your-secret-id',
      SecretKey: 'your-secret-key',
      Bucket: 'your-bucket',
      Region: 'your-region'
    }
  });
};
*/
