"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Paperclip,
  ArrowUp,
  Settings,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useDropletCreation } from "@/hooks/useDropletCreation";
import { useUser } from "@/hooks/useUser";

interface ChatInterfaceProps {
  username?: string;
}

export function ChatInterface({ username }: ChatInterfaceProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showChatInput, setShowChatInput] = useState(false);
  const [streamDropletId, setStreamDropletId] = useState<number | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    dropletInfo?: {
      id?: number;
      name?: string;
      status?: string;
      success: boolean;
    };
  }>>([]);
  
  const { createDroplet, isLoading } = useDropletCreation();
  const { isSignedIn, dbUser } = useUser();

  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => setShowChatInput(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowChatInput(false);
    }
  }, [isSubmitted]);

  // SSE log stream for the current droplet (use droplet ID as job id)
  useEffect(() => {
    if (streamDropletId == null) return;
    setLogLines([]);
    const url = `/api/jobs/${streamDropletId}/logs/stream`;
    const es = new EventSource(url);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { line?: string };
        if (typeof data?.line === "string") {
          setLogLines((prev) => [...prev, data.line!]);
        }
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.close();
    };
  }, [streamDropletId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && isSignedIn) {
      setIsSubmitted(true);
      const userMessage = inputValue.trim();
      const messageId = Date.now().toString();
      
      // Add user message
      setMessages(prev => [...prev, {
        id: messageId,
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
      }]);
      
      // Clear input immediately
      setInputValue("");
      
      try {
        // Try to create droplet
        const response = await createDroplet(userMessage, dbUser?.firstName || username);
        
        // Add assistant response
        setMessages(prev => [...prev, {
          id: `${messageId}-response`,
          type: 'assistant',
          content: response.success 
            ? `✅ Droplet created successfully! ${response.message}`
            : `❌ ${response.message}`,
          timestamp: new Date(),
          dropletInfo: {
            id: response.droplet_id,
            name: response.droplet_name,
            status: response.droplet_status,
            success: response.success,
          }
        }]);
        
        // Start log stream for this droplet (use droplet ID as job id)
        if (response.success && response.droplet_id != null) {
          setStreamDropletId(response.droplet_id);
        }

        // If there are missing parameters, add suggestions
        if (!response.success && response.analysis?.suggestions?.length) {
          setMessages(prev => [...prev, {
            id: `${messageId}-suggestions`,
            type: 'system',
            content: `💡 Suggestions: ${response.analysis?.suggestions.join(', ')}`,
            timestamp: new Date(),
          }]);
        }
        
      } catch (err) {
        // Add error message
        setMessages(prev => [...prev, {
          id: `${messageId}-error`,
          type: 'system',
          content: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
          timestamp: new Date(),
        }]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as React.FormEvent);
    }
  };

  // Render the initial centered view if not submitted yet
  if (!isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-8">
            <h1
              className="text-6xl md:text-7xl font-bold mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Deploy anything
            </h1>
            <p className="text-xl" style={{ color: "var(--muted-foreground)" }}>
            Deploy GPUs/VMs containers just by prompting
            </p>
            {username && (
              <p className="text-lg mt-2" style={{ color: "var(--muted-foreground)" }}>
                Welcome back, {username}!
              </p>
            )}
          </div>
          <div className="flex justify-end mb-4"></div>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <div
                className="flex items-center rounded-2xl p-4 shadow-lg"
                style={{ backgroundColor: "var(--card)" }}
              >
                <button
                  type="button"
                  className="mr-4 p-2 hover:bg-opacity-80 rounded-lg transition-colors"
                >
                  <Paperclip
                    className="w-5 h-5"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isSignedIn ? "Create a GPU droplet in Toronto with Ubuntu 25.04" : "Please sign in to create droplets"}
                  className="flex-1 bg-transparent outline-none text-lg placeholder-opacity-70"
                  style={{
                    color: "var(--foreground)",
                  }}
                />

                <button
                  type="submit"
                  disabled={!isSignedIn || isLoading || !inputValue.trim()}
                  className="ml-4 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-medium">Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Deploy</span>
                      <span
                        className="text-sm px-1 rounded"
                        style={{ backgroundColor: "#5a4a5a", color: "#e0e0e0" }}
                      >
                        GPU
                      </span>
                      <ArrowUp className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render the split-screen view after submission
  return (
    <div
      className="h-screen flex"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Left Panel - Chat */}
      <div
        className="w-1/3 flex flex-col"
        style={{
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Chat Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>Start a conversation to create your droplet!</p>
              <p className="text-sm mt-2">Try: &quot;Create a GPU droplet in Toronto with Ubuntu 25.04&quot;</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'ml-8 bg-primary text-primary-foreground'
                      : message.type === 'assistant'
                      ? 'mr-8 bg-muted'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'user' && <span className="text-sm">👤</span>}
                    {message.type === 'assistant' && <span className="text-sm">🤖</span>}
                    {message.type === 'system' && <span className="text-sm">💡</span>}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.dropletInfo && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                          {message.dropletInfo.success ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Droplet ID: {message.dropletInfo.id}</span>
                              <span>•</span>
                              <span>Status: {message.dropletInfo.status}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span>Creation failed</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section - Always visible input */}
        <div className="p-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="mb-4">
            
            <div
              className="flex items-center gap-2 text-sm mb-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Settings className="w-4 h-4" />
              <span>Started</span>
              <span
                className="font-medium"
                style={{ color: "var(--foreground)" }}
              >
                10xdevs-clone
              </span>
              <span>with</span>
              <span
                className="font-medium"
                style={{ color: "var(--foreground)" }}
              >
                nextjs-monorepo
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-sm mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Eye className="w-4 h-4" />
              <span>Reading</span>
              <FileText className="w-4 h-4" />
              <span
                className="font-medium"
                style={{ color: "var(--foreground)" }}
              >
                docker-compose.yml
              </span>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#4ade80" }}
              ></div>
            </div>
          </div>

          {isLoading && (
            <div
              className="flex items-center justify-between mb-4 p-3 rounded-lg"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#fbbf24" }}
                ></div>
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Generating...
                </span>
              </div>
              <button
                className="text-sm px-3 py-1 rounded"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                Stop
              </button>
            </div>
          )}

          <div
            className="text-xs mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            You can interrupt me at any time
          </div>

          {/* Always visible input field */}
          <form
            onSubmit={handleSubmit}
            className={`transition-all duration-500 ease-out ${
              showChatInput
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-full"
            }`}
          >
            <div className="relative pb-8">
              <div
                className="flex items-center rounded-2xl p-4 shadow-lg"
                style={{ backgroundColor: "var(--card)" }}
              >
                <button
                  type="button"
                  className="mr-4 p-2 hover:bg-opacity-80 rounded-lg transition-colors"
                >
                  <Paperclip
                    className="w-5 h-5"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isSignedIn ? "Create a GPU droplet in Toronto with Ubuntu 25.04" : "Please sign in to create droplets"}
                  className="flex-1 bg-transparent outline-none text-lg placeholder-opacity-70"
                  style={{
                    color: "var(--foreground)",
                  }}
                />

                <button
                  type="submit"
                  disabled={!isSignedIn || isLoading || !inputValue.trim()}
                  className="ml-4 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {/* Agentic max is now part of the input form, so these can be removed or repurposed */}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Terminal */}
      <div
        className="w-2/3 flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* Terminal Header */}
        <div
          className="p-4 border-b flex justify-between items-center"
          style={{ borderColor: "var(--border)" }}
        >
          <div></div>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            bash
          </span>
        </div>

        {/* Terminal Content */}
        <div
          className="flex-1 p-4 font-mono text-sm overflow-y-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          {messages.length === 0 ? (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="mr-2 text-green-500">$</span>
                <span style={{ color: "var(--muted-foreground)" }}>Ready to create droplets...</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-green-500">$</span>
                <span style={{ color: "var(--muted-foreground)" }}>Type your request in the chat to get started</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages
                .filter(msg => msg.type === 'assistant' || msg.type === 'system')
                .map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center">
                      <span className="mr-2 text-green-500">$</span>
                      <span style={{ color: "var(--muted-foreground)" }}>Processing: {message.content}</span>
                    </div>
                    {message.dropletInfo && (
                      <div className="ml-4 space-y-1">
                        {message.dropletInfo.success ? (
                          <>
                            <div className="flex items-center text-green-400">
                              <span className="mr-2">✓</span>
                              <span>Droplet created successfully</span>
                            </div>
                            <div className="flex items-center text-blue-400">
                              <span className="mr-2">→</span>
                              <span>ID: {message.dropletInfo.id}</span>
                            </div>
                            <div className="flex items-center text-blue-400">
                              <span className="mr-2">→</span>
                              <span>Name: {message.dropletInfo.name}</span>
                            </div>
                            <div className="flex items-center text-blue-400">
                              <span className="mr-2">→</span>
                              <span>Status: {message.dropletInfo.status}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center text-red-400">
                            <span className="mr-2">✗</span>
                            <span>Creation failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              }
              {isLoading && (
                <div className="flex items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>
                    Creating droplet
                  </span>
                  <span className="ml-2 animate-pulse">...</span>
                </div>
              )}
              {/* Live log stream from droplet runner (job id = droplet ID) */}
              {streamDropletId != null && (
                <div className="mt-4 pt-4 border-t space-y-0.5" style={{ borderColor: "var(--border)" }}>
                  <div className="text-muted-foreground text-xs mb-2">
                    Live logs (job id: {streamDropletId})
                  </div>
                  {logLines.length === 0 ? (
                    <div className="text-muted-foreground text-xs">Initiating your Machine instance ...</div>
                  ) : (
                    logLines.map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap break-all" style={{ color: "var(--foreground)" }}>
                        {line}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
