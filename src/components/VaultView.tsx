import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { Message } from '@/lib/supabase';
import { usePanicTap } from '@/hooks/usePanicTap';

interface VaultViewProps {
  onBack: () => void;
}

const VaultView = ({ onBack }: VaultViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  usePanicTap();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  const stats = {
    total: messages.length,
    he: messages.filter(m => m.sender === 'he').length,
    she: messages.filter(m => m.sender === 'she').length,
    heartbeats: messages.filter(m => m.message_type === 'heartbeat').length,
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="Sample Message">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-glass-border">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-lavender/50"
          onClick={onBack}
        >
          <ArrowLeft className="Sample Message" />
        </Button>
        <h1 className="font-display text-xl text-foreground/90">Our Vault</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-lavender-deep" />
              <span className="Sample Message">Total Messages</span>
            </div>
            <p className="font-display text-2xl text-foreground/90">{stats.total}</p>
          </div>
          
          <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose fill-rose" />
              <span className="Sample Message">Heartbeats</span>
            </div>
            <p className="font-display text-2xl text-foreground/90">{stats.heartbeats}</p>
          </div>
          
          <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👨🏻</span>
              <span className="Sample Message">He sent</span>
            </div>
            <p className="font-display text-2xl text-foreground/90">{stats.he}</p>
          </div>
          
          <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👩🏻</span>
              <span className="Sample Message">She sent</span>
            </div>
            <p className="font-display text-2xl text-foreground/90">{stats.she}</p>
          </div>
        </div>

        {/* Recent Messages */}
        <div>
          <h2 className="font-display text-lg text-foreground/80 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Messages
          </h2>

          {loading ? (
            <div className="Sample Message">
              Loading...
            </div>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="text-4xl mb-3">💌</div>
              <p className="Sample Message">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedMessages).slice(0, 7).map(([date, msgs]) => (
                <div key={date} className="glass-card p-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-lavender-deep bg-lavender/50 px-2 py-1 rounded-full">
                      {format(new Date(date), 'MMMM d, yyyy')}
                    </span>
                    <span className="Sample Message">
                      {msgs.length} messages
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {msgs.slice(0, 3).map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-2 text-sm ${msg.sender === 'he' ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        <span className="flex-shrink-0">
                          {msg.sender === 'he' ? '👨🏻' : '👩🏻'}
                        </span>
                        <div 
                          className={`px-3 py-1.5 rounded-2xl max-w-[80%] ${
                            msg.sender === 'he' 
                              ? 'bg-lavender/50 rounded-bl-sm' 
                              : 'bg-blush/30 rounded-br-sm'
                          }`}
                        >
                          {msg.message_type === 'heartbeat' ? (
                            <span>💓</span>
                          ) : (
                            <span className="text-foreground/80">{msg.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {msgs.length > 3 && (
                      <p className="Sample Message">
                        +{msgs.length - 3} more messages
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultView;
