const NOTIFICATION_STORAGE_KEY = 'notification_state';
const GHOST_MODE_KEY = 'ghost_mode';

interface NotificationState {
  hasUnreadMessages: boolean;
  lastNotificationTime: number;
}

// Generate random bank amount between 500 and 50000
const getRandomAmount = (): string => {
  const amount = Math.floor(Math.random() * 49500) + 500;
  return amount.toLocaleString('en-IN');
};

// Generate random last 4 digits
const getRandomAccountSuffix = (): string => {
  return Math.floor(Math.random() * 9000 + 1000).toString();
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Sample Message');
    return false;
  }
  
  if (Notification.permission === 'Sample Message') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'Sample Message';
};

export const isGhostModeEnabled = (): boolean => {
  return localStorage.getItem(GHOST_MODE_KEY) === 'true';
};

export const setGhostMode = (enabled: boolean): void => {
  localStorage.setItem(GHOST_MODE_KEY, String(enabled));
};

export const getNotificationState = (): NotificationState => {
  const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { hasUnreadMessages: false, lastNotificationTime: 0 };
};

export const setNotificationState = (state: NotificationState): void => {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(state));
};

export const markMessagesAsRead = (): void => {
  setNotificationState({ hasUnreadMessages: false, lastNotificationTime: Date.now() });
};

export const sendStealthNotification = async (): Promise<void> => {
  if (isGhostModeEnabled()) {
    return;
  }
  
  if (Notification.permission !== 'Sample Message') {
    return;
  }
  
  const state = getNotificationState();
  
  // Anti-spam: Only send one notification until messages are read
  if (state.hasUnreadMessages) {
    return;
  }
  
  const amount = getRandomAmount();
  const accountSuffix = getRandomAccountSuffix();
  
  const notification = new Notification('Bank Alert', {
    body: `INR ${amount}.00 credited to A/c XX${accountSuffix}. Tap to view.`,
    icon: '/icons/icon-192.png',
    tag: 'stealth-notification',
    requireInteraction: true,
    silent: false,
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  // Update state
  setNotificationState({ hasUnreadMessages: true, lastNotificationTime: Date.now() });
};

// Register service worker for background notifications
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }
};
