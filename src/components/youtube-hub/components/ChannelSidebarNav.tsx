"use client";

import Image from "next/image";
import { Grid, Video } from "lucide-react";
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

function ChannelLogo({
  channel,
  size,
}: {
  channel: Channel;
  size: "sm" | "md";
}) {
  const src = channel.custom_logo || null;
  const dim = size === "md" ? 56 : 40;

  if (src) {
    return (
      <Image
        src={src}
        alt={channel.name}
        width={dim}
        height={dim}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        unoptimized
      />
    );
  }

  return (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <Video
        className={
          size === "md"
            ? "w-5 h-5 xl:w-6 xl:h-6 text-slate-300"
            : "w-4 h-4 text-slate-300"
        }
      />
    </div>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar({
  channels,
  activeChannelId,
  onSelect,
  onBack,
}: ChannelSidebarNavProps) {
  return (
    <aside className="hidden lg:flex w-14 xl:w-20 bg-white border-r border-slate-200 flex-col items-center py-4 xl:py-6 gap-4 xl:gap-6 sticky top-20 h-[calc(100vh-80px)] z-50 shrink-0">
      {/* Back to library grid */}
      <button
        onClick={onBack}
        title="Back to Spiritual Library"
        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 mb-4 group"
      >
        <Grid className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Channel icon list */}
      <div className="flex flex-col items-center gap-3 xl:gap-5 flex-grow overflow-y-auto w-full custom-scrollbar pb-6 px-1">
        {channels.map((channel) => {
          const isActive = channel.channel_id === activeChannelId;

          return (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.channel_id)}
              title={channel.name}
              className={`relative group p-1.5 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-devo-500 ring-offset-4 bg-slate-100"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 xl:w-14 xl:h-14 rounded-lg xl:rounded-xl overflow-hidden shadow-md border-2 border-white bg-slate-200 flex items-center justify-center">
                <ChannelLogo channel={channel} size="md" />
              </div>

              {/* Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-devo-950 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                {channel.name}
              </span>
            </button>
          );
        })}
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
    <div className="lg:hidden relative z-[60] bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
        {channels.map((channel) => {
          const isActive = channel.channel_id === activeChannelId;

          return (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.channel_id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                isActive ? "scale-105" : "opacity-60"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shadow-sm ${
                  isActive
                    ? "border-devo-500 ring-2 ring-devo-100"
                    : "border-white"
                }`}
              >
                <ChannelLogo channel={channel} size="md" />
              </div>

              {/* First word of channel name */}
              <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600 truncate max-w-[60px]">
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

/**
 * Renders the channel navigation in two responsive forms:
 *  - Desktop (lg+): sticky vertical icon sidebar on the left edge
 *  - Mobile (<lg): horizontal scrollable icon bar at the top of the page
 */
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
