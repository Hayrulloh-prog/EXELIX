import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../lib/api";
import UserDataSync from "../lib/userDataSync";

export function LoginSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const called = React.useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const handleLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        toast.error(t("auth.invalidToken", "Неверный токен авторизации."), { id: "login-error" });
        navigate("/login");
        return;
      }

      try {
        // Save the token to local storage
        localStorage.setItem("token", token);
        localStorage.setItem("userToken", token);

        // Fetch user info from /users/me to initialize local user profile data
        const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const apiUserData = await response.json();
          // Correctly format avatar url
          if (
            apiUserData.avatarUrl &&
            (apiUserData.avatarUrl.startsWith("/api/") || apiUserData.avatarUrl.startsWith("http"))
          ) {
            apiUserData.avatarUrl = apiUserData.avatarUrl.startsWith("http")
              ? apiUserData.avatarUrl
              : `${API_BASE_URL}${apiUserData.avatarUrl}`;
          }

          // Sync user profile to localStorage
          UserDataSync.save(apiUserData);
          toast.success(t("auth.loginSuccess", "Вы успешно вошли!"), { id: "login-success" });
          navigate("/dashboard");
        } else {
          toast.error(t("auth.loadProfileError", "Не удалось загрузить данные профиля."), { id: "login-error" });
          navigate("/login");
        }
      } catch (error) {
        console.error("Error logging in:", error);
        toast.error(t("auth.loadProfileError", "Не удалось загрузить данные профиля."), { id: "login-error" });
        navigate("/login");
      }
    };

    handleLogin();
  }, [navigate, t]);

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg animate-pulse">
          {t("auth.processingLogin", "Выполняется вход, пожалуйста подождите...")}
        </p>
      </div>
    </div>
  );
}
