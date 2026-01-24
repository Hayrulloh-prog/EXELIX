"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2, Edit, Phone, Copy, Check, Download } from "lucide-react";
import { PushNotificationButton } from "@/components/PushNotificationButton";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
  telegram: string | null;
  avatarUrl: string | null;
  status: string;
  language: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    phoneCountry: "KG",
    telegram: "",
    avatar: "",
    status: "closed",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    fetchUser();
  }, [router]);

  const fetchUser = async () => {
    try {
      const response = await api.get("/users/me");
      const userData = response.data;
      setUser(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        phoneCountry: userData.phoneCountry,
        telegram: userData.telegram || "",
        avatar: "",
        status: userData.status,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push("/");
      }
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/users/me", formData);
      setUser(response.data.user);
      setEditing(false);
      toast.success(t("dashboard.saved"));
      fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${user?.phone}`;
  };

  const handleCopyTelegram = () => {
    if (user?.telegram) {
      navigator.clipboard.writeText(user.telegram);
      setCopied(true);
      toast.success(t("dashboard.telegramCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallPWA = () => {
    // PWA install prompt will be handled by service worker
    if ("serviceWorker" in navigator) {
      toast.success("PWA installation available");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t("dashboard.title")}
            </h1>
            <div className="flex gap-2 flex-wrap">
              <PushNotificationButton />
              <button
                onClick={handleInstallPWA}
                className="btn btn-outline flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("dashboard.downloadApp")}
              </button>
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary-100 flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-600">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="btn btn-outline flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t("dashboard.edit")}
              </button>
            </div>

            {!editing ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b gap-2">
                  <span className="font-medium">{t("dashboard.status")}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      user.status === "open"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.status === "open"
                      ? t("register.statusOpen")
                      : t("register.statusClosed")}
                  </span>
                </div>

                {user.telegram && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b gap-2">
                    <span className="font-medium">
                      {t("dashboard.telegram")}
                    </span>
                    <button
                      onClick={handleCopyTelegram}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {t("dashboard.copyTelegram")}
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleCall}
                    className="btn btn-primary flex items-center gap-2 w-full sm:flex-1"
                  >
                    <Phone className="w-4 h-4" />
                    {t("dashboard.call")}
                  </button>
                  {user.telegram && (
                    <button
                      onClick={handleCopyTelegram}
                      className="btn btn-outline flex items-center gap-2 w-full sm:flex-1"
                    >
                      <Copy className="w-4 h-4" />
                      Telegram
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("register.firstName")}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("register.lastName")}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("register.phone")}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={formData.phoneCountry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneCountry: e.target.value,
                        })
                      }
                      className="input w-32"
                    >
                      <option value="KG">🇰🇬</option>
                      <option value="RU">🇷🇺</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="input flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("register.telegram")}
                  </label>
                  <input
                    type="text"
                    value={formData.telegram}
                    onChange={(e) =>
                      setFormData({ ...formData, telegram: e.target.value })
                    }
                    className="input"
                    placeholder="@username"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setEditing(false)}
                    className="btn btn-secondary w-full sm:flex-1"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary w-full sm:flex-1"
                  >
                    {t("common.save")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
