"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // In a real app, you would get this from your server
      const vapidPublicKey = "YOUR_VAPID_PUBLIC_KEY_HERE";

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(subscription);
      console.log("Push subscription successful:", subscription);

      // Send subscription to your server here
      // await sendSubscriptionToServer(subscription)
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        console.log("Successfully unsubscribed from push notifications");
      }
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
    }
  };

  const sendTestNotification = async () => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Test Notification", {
          body: "This is a test notification from your PWA!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        });
      } catch (error) {
        console.error("Error sending test notification:", error);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Push Notifications
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Permission Status:{" "}
              <span className="font-medium">{permission}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Subscription:{" "}
              <span className="font-medium">
                {subscription ? "Active" : "Inactive"}
              </span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!subscription ? (
              <button
                onClick={subscribeToPush}
                className="
                  h-12 px-6 bg-blue-600 text-white rounded-md font-medium
                  hover:bg-blue-700 focus:outline-none focus:ring-2
                  focus:ring-blue-500 focus:ring-offset-2 transition-colors
                  min-w-[3rem] text-base
                "
                aria-label="Enable push notifications"
              >
                Enable Notifications
              </button>
            ) : (
              <>
                <button
                  onClick={sendTestNotification}
                  className="
                    h-12 px-6 bg-green-600 text-white rounded-md font-medium
                    hover:bg-green-700 focus:outline-none focus:ring-2
                    focus:ring-green-500 focus:ring-offset-2 transition-colors
                    min-w-[3rem] text-base
                  "
                  aria-label="Send test notification"
                >
                  Test Notification
                </button>
                <button
                  onClick={unsubscribeFromPush}
                  className="
                    h-12 px-6 bg-red-600 text-white rounded-md font-medium
                    hover:bg-red-700 focus:outline-none focus:ring-2
                    focus:ring-red-500 focus:ring-offset-2 transition-colors
                    min-w-[3rem] text-base
                  "
                  aria-label="Disable push notifications"
                >
                  Disable
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
