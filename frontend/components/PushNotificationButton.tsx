"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellOff } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function PushNotificationButton() {
  const { t } = useTranslation();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported");
      return;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setLoading(false);
        return;
      }

      // Get VAPID public key from backend
      const vapidKeyResponse = await api.get("/push/vapid-key");
      const vapidKey = vapidKeyResponse.data.publicKey;

      // Convert base64 public key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to backend
      await api.post("/users/push-subscribe", {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      toast.success("Push notifications enabled");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to enable push notifications",
      );
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await api.post("/users/push-subscribe", { subscription: null });
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      toast.error("Failed to disable push notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="btn btn-outline flex items-center gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4" />
          Disable Notifications
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          Enable Notifications
        </>
      )}
    </button>
  );
}
