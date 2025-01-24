<template>
  <div class="m_lost">
    <h1>移动端忘记密码页面</h1>
    <van-form @submit="sendEmail">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="请输入注册时的邮箱"
          :rules="emailRules"
        />
        <van-field
          v-if="isEmailSent"
          v-model="code"
          name="code"
          label="验证码"
          placeholder="请输入验证码"
          :rules="verificationCodeRules"
        />
      </van-cell-group>
      <div
        style="
          margin: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        "
      >
        <van-button
          v-if="!isEmailSent"
          round
          block
          type="primary"
          native-type="submit"
        >
          发送验证码
        </van-button>
        <van-button
          v-if="isEmailSent"
          round
          block
          type="primary"
          @click="verify"
        >
          进行验证
        </van-button>
        <van-button round block plain type="primary" @click="goToLogin">
          返回登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { emailRules, verificationCodeRules } from "@/utils/validators";
import { forgetPassword, verifyAndLogin } from "@/api/user";
import { showSuccessToast, showFailToast } from "vant";
import { useAuthStore } from "@/pinia/useAuthStore";
import "vant/lib/index.css";

const email = ref("");
const code = ref("");
const isEmailSent = ref(false);

const sendEmail = async (values: { email: string }) => {
  try {
    console.log("提交" + values);
    console.log("提交的邮箱: " + values.email);
    const result = await forgetPassword(values.email);
    isEmailSent.value = true;
    showSuccessToast(result.data);
  } catch (error: any) {
    // 错误处理
    console.error("发送失败:", error);
    showFailToast({
      message: "发送失败" + "\n" + error.message,
      position: "middle",
    });
  }
};

const verify = async () => {
  try {
    // 1.发送登录请求
    const loginData = await verifyAndLogin(code.value, email.value);

    // 登录成功提示
    showSuccessToast({
      message: "登录成功",
      position: "middle",
    });

    // 2. 设置认证状态
    const authStore = useAuthStore();
    authStore.checkAuth();
    // 3. 路由跳转
    router.push("/");
  } catch (error: any) {
    // 错误处理
    console.error("登录失败:", error);
    showFailToast({
      message: "登录失败" + "\n" + error.message,
      position: "middle",
    });
  }
};

const router = useRouter();
const goToLogin = () => {
  router.push("/login");
};
</script>

<style>
.van-button {
  width: 15rem; /* 或者其他适合的宽度 */
}

.m_lost {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 90vh; /* 使容器占据较大的视口高度 */
}
</style>
