import React, { createContext, useContext, useState, useCallback } from "react";
import Notification from "../components/Notification";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    actions: [],
    duration: 4000,
  });

  const showNotification = useCallback(
    ({ type, title, message, actions, duration }) => {
      setNotification({
        visible: true,
        type: type || "info",
        title: title || "",
        message: message || "",
        actions: actions || [],
        duration: duration !== undefined ? duration : 4000,
      });
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  // Convenience methods
  const success = useCallback(
    (title, message, actions, duration) => {
      showNotification({ type: "success", title, message, actions, duration });
    },
    [showNotification]
  );

  const error = useCallback(
    (title, message, actions, duration) => {
      showNotification({ type: "error", title, message, actions, duration });
    },
    [showNotification]
  );

  const warning = useCallback(
    (title, message, actions, duration) => {
      showNotification({ type: "warning", title, message, actions, duration });
    },
    [showNotification]
  );

  const info = useCallback(
    (title, message, actions, duration) => {
      showNotification({ type: "info", title, message, actions, duration });
    },
    [showNotification]
  );

  const showConfirm = useCallback(
    ({
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      confirmStyle,
    }) => {
      const actions = [
        {
          text: cancelText || "Cancel",
          onPress: () => {
            hideNotification();
            onCancel?.();
          },
          style: "default",
        },
        {
          text: confirmText || "Confirm",
          onPress: () => {
            hideNotification();
            onConfirm?.();
          },
          style: confirmStyle || "primary",
        },
      ];

      showNotification({
        type: confirmStyle === "destructive" ? "warning" : "info",
        title,
        message,
        actions,
        duration: 0, // Don't auto-dismiss confirmations
      });
    },
    [showNotification, hideNotification]
  );

  const value = {
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info,
    showConfirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification
        visible={notification.visible}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        actions={notification.actions}
        duration={notification.duration}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
