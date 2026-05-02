"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Video } from "lucide-react";
import type { Channel } from "../types";

interface ChannelSidebarNavProps {
  channels: Channel[];
  /** The `channel_id` (UCxx…) of the currently active channel, or null */
  activeChannelId: string | null;
  /** Called when the user clicks a channel icon */
  onSelect: (channelId: string) => void;
  /** Called when the user clicks the back-to-grid button (desktop only) */
  onBack: () => void;
}

// ─── Shared logo renderer ─────────────────────────────────────────────────────

function ChannelLogo({ channel }: { channel: Channel }) {
  const src = channel.custom_logo || null;

  if (src) {
    return (
      <Image
        src={src}
        alt={channel.name}
        width={32}
        height={32}
        className="object-cover w-full h-full"
        unoptimized
      />
    );
  }

  return (
    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
      <Video className="h-3.5 w-3.5 text-neutral-400" />
    </div>
  );
}

// ─── Desktop sidebar — collapses to icons, expands on hover ───────────────────

function DesktopSidebar({
  channels,
  activeChannelId,
  onSelect,
  onBack,
}: ChannelSidebarNavProps) {
  const [hovered, setHovered] = useState(false);
  const expanded = hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`hidden lg:flex sticky top-16 h-[calc(100vh-64px)] z-40 shrink-0 flex-col border-r border-neutral-200 transition-[width,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        expanded
          ? "w-60 bg-white shadow-[8px_0_24px_-12px_rgba(62,74,69,0.15)]"
          : "w-14 bg-white"
      }`}
    >
      {/* Back to library */}
      <div className="border-b border-neutral-100 px-2 py-2">
        <button
          onClick={onBack}
          title="Back to library"
          className={`group flex items-center gap-2.5 rounded-md text-[13px] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors w-full ${
            expanded ? "px-2 h-9" : "h-9 justify-center"
          }`}
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span
            className={`whitespace-nowrap transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-x-0 max-w-[160px]"
                : "opacity-0 -translate-x-1 max-w-0 overflow-hidden"
            }`}
          >
            Library
          </span>
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2">
        <p
          className={`px-2 text-[11px] font-medium text-neutral-500 transition-all duration-300 ease-out ${
            expanded
              ? "mb-1 opacity-100 max-h-5"
              : "mb-0 opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          Channels
        </p>
        <ul className="space-y-0.5">
          {channels.map((channel, idx) => {
            const isActive = channel.channel_id === activeChannelId;
            // Stagger the label reveal slightly per row when expanding
            const labelDelayMs = expanded ? Math.min(idx * 18, 220) : 0;

            return (
              <li key={channel.id}>
                <button
                  onClick={() => onSelect(channel.channel_id)}
                  title={channel.name}
                  className={`group relative flex w-full items-center gap-2.5 rounded-md transition-colors duration-200 ${
                    expanded ? "px-2 h-10" : "h-10 justify-center"
                  } ${
                    isActive
                      ? "bg-[#e6ebe2] text-[#3E4A45]"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {/* Active indicator strip */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full bg-[#7A8F78] transition-all duration-300 ${
                      isActive
                        ? "h-5 opacity-100 scale-y-100"
                        : "h-0 opacity-0 scale-y-50"
                    }`}
                  />

                  {/* Avatar */}
                  <div
                    className={`h-7 w-7 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 transition-transform duration-300 ${
                      isActive ? "scale-105" : "group-hover:scale-105"
                    }`}
                  >
                    <ChannelLogo channel={channel} />
                  </div>

                  {/* Label — fade + slide in, staggered */}
                  <span
                    className={`min-w-0 flex-1 truncate text-left text-[13px] transition-all ease-out ${
                      expanded
                        ? "opacity-100 translate-x-0 max-w-[180px]"
                        : "opacity-0 -translate-x-1 max-w-0 overflow-hidden"
                    } ${isActive ? "font-medium" : ""}`}
                    style={{
                      transitionDuration: expanded ? "320ms" : "150ms",
                      transitionDelay: `${labelDelayMs}ms`,
                    }}
                  >
                    {channel.name}
                  </span>

                  {/* Tooltip (collapsed mode only) */}
                  {!expanded && (
                    <span className="absolute left-full ml-2 px-2 h-7 flex items-center bg-[#3E4A45] text-white text-[12px] font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md">
                      {channel.name}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Subtle hint at bottom: hover-to-expand affordance */}
      <div
        className={`border-t border-neutral-100 px-3 py-2 transition-opacity duration-200 ${
          expanded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <p className="text-[10px] text-neutral-400 text-center">›</p>
      </div>
    </aside>
  );
}

// ─── Mobile top bar ───────────────────────────────────────────────────────────

function MobileTopBar({
  channels,
  activeChannelId,
  onSelect,
}: Omit<ChannelSidebarNavProps, "onBack">) {
  return (
    <div className="lg:hidden relative z-[60] bg-white border-b border-neutral-200 px-3 py-2.5">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {channels.map((channel) => {
          const isActive = channel.channel_id === activeChannelId;

          return (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.channel_id)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-opacity"
            >
              <div
                className={`h-11 w-11 rounded-lg overflow-hidden ring-1 transition-all ${
                  isActive
                    ? "ring-[#7A8F78] ring-2"
                    : "ring-black/5 opacity-70"
                }`}
              >
                <ChannelLogo channel={channel} />
              </div>
              <span
                className={`text-[10px] truncate max-w-[64px] ${
                  isActive ? "text-[#3E4A45] font-medium" : "text-neutral-500"
                }`}
              >
                {channel.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composed export ──────────────────────────────────────────────────────────

export default function ChannelSidebarNav(props: ChannelSidebarNavProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileTopBar
        channels={props.channels}
        activeChannelId={props.activeChannelId}
        onSelect={props.onSelect}
      />
    </>
  );
}
