import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission } from '@/lib/notifications';

interface NotificationPermissionProps {
  onClose: () => void;
}

const NotificationPermission = ({ onClose }: NotificationPermissionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleAllow = async () => {
    await requestNotificationPermission();
    onClose();
  };

  const handleDeny = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`
          glass max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-glass-border
          transform transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <button 
          onClick={handleDeny}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="Sample Message" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender-deep/20 flex items-center justify-center">
            <Bell className="w-8 h-8 text-lavender-deep" />
          </div>
          <h2 className="font-display text-xl mb-2">Start a private conversation</h2>
          <p className="Sample Message">
            Get instant alerts when you receive new messages. 
            Your notifications will appear as discreet bank alerts.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleAllow}
            className="w-full rounded-xl bg-gradient-to-r from-lavender-deep to-blush-deep hover:opacity-90"
          >
            Allow Notifications
          </Button>
          <Button
            variant="ghost"
            onClick={handleDeny}
            className="w-full rounded-xl"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
