import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services";
import { getUserConversations } from "~/services/messaging.server";
import { PageContainer } from "~/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export const meta: MetaFunction = () => [
  { title: "Messages | Pixel Studio" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const conversations = await getUserConversations(user.id);
  return json({ conversations, userId: user.id });
}

interface ConversationData {
  id: string;
  otherUser: {
    id: string;
    username: string;
    image: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    read: boolean;
    createdAt: string;
  } | null;
  updatedAt: string;
}

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    image: string | null;
  };
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationData[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Visit a user&apos;s profile to start a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            "w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors",
            activeId === conv.id && "bg-accent"
          )}
        >
          <Avatar className="h-10 w-10 shrink-0">
            {conv.otherUser.image && (
              <AvatarImage src={conv.otherUser.image} alt={conv.otherUser.username} />
            )}
            <AvatarFallback>{conv.otherUser.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{conv.otherUser.username}</p>
            {conv.lastMessage && (
              <p className="text-xs text-muted-foreground truncate">
                {conv.lastMessage.content}
              </p>
            )}
          </div>
          {conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId === conv.otherUser.id && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

function MessageThread({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const messagesFetcher = useFetcher<{ success: boolean; data: { messages: MessageData[] } }>();
  const sendFetcher = useFetcher();
  const formRef = React.useRef<HTMLFormElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [messages, setMessages] = React.useState<MessageData[]>([]);

  // Load messages when conversation changes
  const loadMessages = React.useCallback(() => {
    messagesFetcher.load(`/api/messages/${conversationId}`);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Update messages when fetcher data arrives
  React.useEffect(() => {
    if (messagesFetcher.data?.success && messagesFetcher.data.data.messages) {
      setMessages(messagesFetcher.data.data.messages);
    }
  }, [messagesFetcher.data]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear form after send
  React.useEffect(() => {
    if (sendFetcher.state === "idle" && sendFetcher.data) {
      formRef.current?.reset();
      loadMessages();
    }
  }, [sendFetcher.state, sendFetcher.data, loadMessages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content")?.toString().trim();
    if (!content) return;

    sendFetcher.submit(formData, {
      method: "POST",
      action: `/api/messages/${conversationId}`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesFetcher.state === "loading" && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2 max-w-[80%]",
                  isOwn ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {!isOwn && (
                  <Avatar className="h-6 w-6 shrink-0">
                    {msg.sender.image && (
                      <AvatarImage src={msg.sender.image} alt={msg.sender.username} />
                    )}
                    <AvatarFallback className="text-xs">
                      {msg.sender.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
          <Input
            name="content"
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={sendFetcher.state !== "idle"}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { conversations, userId } = useLoaderData<typeof loader>();
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(
    conversations[0]?.id ?? null
  );

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto py-6 md:py-10">
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
              <p className="text-muted-foreground">
                Your conversations with other creators
              </p>
            </div>
          </div>
        </div>

        <Card className="h-[calc(100vh-16rem)]">
          <div className="flex h-full">
            {/* Conversation list */}
            <div className="w-80 border-r border-border overflow-y-auto shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversations</CardTitle>
              </CardHeader>
              <ConversationList
                conversations={conversations as ConversationData[]}
                activeId={activeConversationId}
                onSelect={setActiveConversationId}
              />
            </div>

            {/* Message thread */}
            <div className="flex-1 flex flex-col">
              {activeConversationId ? (
                <MessageThread
                  conversationId={activeConversationId}
                  userId={userId}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a conversation from the sidebar or{" "}
                      <Link to="/users" className="text-primary hover:underline">
                        find someone to message
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
