import { Clock, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { PendingMessage } from '@/hooks/useMessageQueue';

interface PendingMessageBubbleProps {
  message: PendingMessage;
  onRetry: (id: string) => void;
}

const PendingMessageBubble = ({ message, onRetry }: PendingMessageBubbleProps) => {
  const StatusIcon = () => {
    switch (message.status) {
      case 'pending':
        return <Clock className="Sample Message" />;
      case 'sending':
        return <RefreshCw className="w-3.5 h-3.5 text-lavender-deep animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <Check className="w-3.5 h-3.5 text-green-500" />;
    }
  };

  return (
    <div className="flex justify-end mb-3 animate-fade-in">
      <div className="relative max-w-[80%]">
        <div className="bubble-sent px-4 py-2.5 opacity-70">
          {message.message_type === 'heartbeat' ? (
            <span className="text-4xl">💓</span>
          ) : (
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-1.5 mt-1 px-1">
          <StatusIcon />
          
          {message.status === 'failed' && (
            <button
              onClick={() => onRetry(message.id)}
              className="text-xs text-destructive hover:underline flex items-center gap-1"
            >
              Tap to retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingMessageBubble;
