import axiosInstance from "@/utils/axios";

async function login(email: string, password: string) {
  const response = await axiosInstance.post("/users/login", {
    email: email,
    password: password,
  });
  return response.data;
}
