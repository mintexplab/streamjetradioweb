import { useState, useRef, useEffect } from 'react';
import { useConversations, useDirectMessages, useSendDM } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function MessagesView() {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const { t } = useI18n();

  if (selectedPartner) {
    return <ChatThread partnerId={selectedPartner} onBack={() => setSelectedPartner(null)} />;
  }

  return <ConversationList onSelect={setSelectedPartner} />;
}

function ConversationList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: conversations, isLoading } = useConversations();
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('conversations')}</h2>

      {!conversations || conversations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => onSelect(conv.partnerId)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent/40 transition-colors text-left"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={conv.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {conv.profile?.display_name || conv.profile?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                  {conv.lastMessage.content}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatThread({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const { data: messages } = useDirectMessages(partnerId);
  const sendDM = useSendDM();
  const { user } = useAuth();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendDM.mutateAsync({ receiverId: partnerId, content: text.trim() });
    setText('');
  };

  // Get partner profile from first message context or fetch
  const partnerName = 'User';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="w-8 h-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <p className="font-semibold text-sm">{t('message')}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[75%] px-3 py-2 text-sm animate-fade-in',
              msg.sender_id === user?.id
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {msg.content}
            <span className={cn(
              'block text-[10px] mt-1',
              msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('typeMessage')}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendDM.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
