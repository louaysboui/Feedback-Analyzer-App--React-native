// NotificationState.ts
interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const notificationState: { notifications: Notification[]; setNotifications: (notifications: Notification[]) => void } = {
  notifications: [],
  setNotifications: (newNotifications: Notification[]) => {
    notificationState.notifications = newNotifications;
  },
};

export const addNotification = (message: string) => {
  const newNotification: Notification = {
    id: Date.now(),
    message,
    timestamp: new Date().toLocaleString(),
  };
  notificationState.setNotifications([...notificationState.notifications, newNotification]);
};

export const clearNotifications = () => {
  notificationState.setNotifications([]);
};

export const getNotifications = () => notificationState.notifications;