"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Paperclip,
  ArrowUp,
  Settings,
  Edit,
  Wrench,
  User,
  Eye,
  FileText,
  Plus,
} from "lucide-react";

export default function Home() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [terminalLines] = useState<string[]>([
    "superlamp@dev:/$ cd /home/project/10xdevs-clone && bun install",
    "bun install v1.0.0",
    "",
    "+ @biomejs/biome",
    "+ @eslint/eslintrc",
    "+ @types/node",
    "+ @types/react",
    "+ @types/react-dom",
    "+ eslint",
    "+ eslint-config-next",
    "+ postcss",
    "+ tailwindcss",
    "+ typescript",
    "+ class-variance-authority",
    "+ clsx",
    "+ lucide-react",
    "+ next",
    "+ react",
    "+ react-dom",
    "+ same-runtime",
    "+ tailwind-merge",
    "+ tailwindcss-animate",
    "",
    "378 packages installed",
    "✓",
  ]);

  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => setShowChatInput(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowChatInput(false);
    }
  }, [isSubmitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsSubmitted(true);
      setIsGenerating(true);
      // Simulate generation stopping after 3 seconds
      setTimeout(() => {
        setIsGenerating(false);
      }, 3000);
      setInputValue(""); // Clear input after submission
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
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
            Deploy GPUs/VMs containers just by prompting             </p>
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
                  placeholder="Deploy this Monorepo on AWS ECS"
                  className="flex-1 bg-transparent outline-none text-lg placeholder-opacity-70"
                  style={{
                    color: "var(--foreground)",
                  }}
                />

                <button
                  type="submit"
                  className="ml-4 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <span className="font-medium">Super</span>
                  <span
                    className="text-sm px-1 rounded"
                    style={{ backgroundColor: "#5a4a5a", color: "#e0e0e0" }}
                  >
                    max
                  </span>
                  <ArrowUp className="w-4 h-4" />
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
          <div className="mb-6">
            <h2
              className="text-lg font-medium mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Here's a quick plan to Deploy your Monorepo:
            </h2>
            <ol
              className="space-y-3 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              <li className="flex">
                <span className="mr-3 font-medium">1.</span>
                <span>Set up a Next.js + TailwindCSS project.</span>
              </li>
              <li className="flex">
                <span className="mr-3 font-medium">2.</span>
                <span>
                  Configure fonts and gradient/dark backgrounds as on the
                  original site.
                </span>
              </li>
              <li className="flex">
                <span className="mr-3 font-medium">3.</span>
                <span>Recreate the headline and tagline section.</span>
              </li>
              <li className="flex">
                <span className="mr-3 font-medium">4.</span>
                <span>
                  Build the responsive founder cards grid with proper gradients
                  and hover effects.
                </span>
              </li>
              <li className="flex">
                <span className="mr-3 font-medium">5.</span>
                <span>
                  Ensure responsive and pixel-perfect similarity, following
                  original colors and layout.
                </span>
              </li>
            </ol>
          </div>

          <div
            className="mb-6 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <p>
              Let me know if you want the homepage only, or if you'd like me to
              explore any other specific sections/pages before starting.
              Otherwise, I'll start building the homepage right away!
            </p>
          </div>

          <button
            className="text-sm px-3 py-1 rounded"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            full page
          </button>

          <div
            className="mt-4 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            ↳ Rollback to message
          </div>
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

          {isGenerating && (
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

          <button
            className="flex items-center gap-2 text-sm mb-4 p-2 rounded"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Plus className="w-4 h-4" />
            <span>Add context</span>
          </button>

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
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent outline-none text-lg placeholder-opacity-70"
                  style={{
                    color: "var(--foreground)",
                  }}
                />

                <button
                  type="submit"
                  className="ml-4 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <span className="font-medium">Super</span>
                  <span
                    className="text-sm px-1 rounded"
                    style={{ backgroundColor: "#5a4a5a", color: "#e0e0e0" }}
                  >
                    max
                  </span>
                  <ArrowUp className="w-4 h-4" />
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
          {terminalLines.map((line, index) => (
            <div key={index} className="mb-1">
              {line.startsWith("+") ? (
                <span style={{ color: "#4ade80" }}>{line}</span>
              ) : line === "✓" ? (
                <span style={{ color: "#4ade80" }}>{line}</span>
              ) : line.includes("packages installed") ? (
                <span style={{ color: "#4ade80" }}>{line}</span>
              ) : (
                <span style={{ color: "var(--muted-foreground)" }}>{line}</span>
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center">
              <span style={{ color: "var(--muted-foreground)" }}>
                Installing packages
              </span>
              <span className="ml-2 animate-pulse">...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
