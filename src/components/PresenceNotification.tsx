import { X } from 'lucide-react';

interface PresenceEvent {
  type: 'join' | 'leave';
  userId: string;
  nickname: string;
  timestamp: number;
}

interface PresenceNotificationProps {
  events: PresenceEvent[];
  onDismiss: (timestamp: number) => void;
}

const PresenceNotification = ({ events, onDismiss }: PresenceNotificationProps) => {
  if (events.length === 0) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
      {events.map((event) => (
        <div
          key={event.timestamp}
          className={`
            glass rounded-2xl px-4 py-2.5 shadow-lg border border-glass-border
            animate-fade-in flex items-center justify-between gap-3
            ${event.type === 'join' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-rose/10 border-rose/30'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{event.type === 'join' ? '💫' : '👋'}</span>
            <span className="text-sm font-medium">
              {event.nickname} {event.type === 'join' ? 'joined the chat' : 'left the chat'}
            </span>
            <span className={`w-2 h-2 rounded-full ${event.type === 'join' ? 'bg-green-500' : 'bg-rose'}`} />
          </div>
          <button
            onClick={() => onDismiss(event.timestamp)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="Sample Message" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default PresenceNotification;
