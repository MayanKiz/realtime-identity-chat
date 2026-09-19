import { useState } from 'react';
import { Heart, Flame, Sparkles, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { Message } from '@/lib/supabase';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onReaction: (messageId: string, reaction: string) => void;
}

const REACTIONS = [
  { emoji: '❤️', icon: Heart },
  { emoji: '🔥', icon: Flame },
  { emoji: '✨', icon: Sparkles },
];

const MessageBubble = ({ message, isSent, onReaction }: MessageBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];

  const handleLongPress = () => {
    setShowReactions(true);
    setTimeout(() => setShowReactions(false), 3000);
  };

  if (message.message_type === 'heartbeat') {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} my-4`}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-5xl heartbeat-pulse">💓</div>
          <span className="Sample Message">
            {isSent ? 'You sent a heartbeat' : 'Sent you a heartbeat'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
      onTouchStart={() => {
        const timeout = setTimeout(handleLongPress, 500);
        const clear = () => clearTimeout(timeout);
        document.addEventListener('touchend', clear, { once: true });
        document.addEventListener('touchmove', clear, { once: true });
      }}
    >
      <div className="relative max-w-[80%]">
        {/* Reactions popup */}
        {showReactions && (
          <div 
            className={`absolute ${isSent ? 'right-0' : 'left-0'} -top-12 glass-card px-2 py-1.5 flex gap-1 animate-scale-in z-10`}
          >
            {REACTIONS.map(({ emoji }) => (
              <button
                key={emoji}
                onClick={() => {
                  onReaction(message.id, emoji);
                  setShowReactions(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-lavender/50 flex items-center justify-center text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={`px-4 py-2.5 ${isSent ? 'bubble-sent' : 'bubble-received'}`}
        >
          {message.message_type === 'voice' ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="waveform-bar w-1 bg-lavender-deep rounded-full"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="Sample Message">0:03</span>
            </div>
          ) : (
            <p className="text-foreground/90 text-[15px] leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Reactions display */}
        {reactions.length > 0 && (
          <div className={`absolute ${isSent ? 'left-0' : 'right-0'} -bottom-2 flex gap-0.5`}>
            {reactions.map((reaction, i) => (
              <span 
                key={i} 
                className="text-sm bg-card rounded-full px-1 shadow-sm border border-border"
              >
                {reaction}
              </span>
            ))}
          </div>
        )}

        {/* Time and read receipt */}
        <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
          <span className="Sample Message">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isSent && (
            message.is_read ? (
              <div className="flex text-blush-deep">
                <Heart className="w-3 h-3 fill-current" />
              </div>
            ) : (
              <CheckCheck className="Sample Message" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
