export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  date?: string;
  published: string;
  type: "video" | "live" | "short" | "playlist";
  playlistCount?: number;
  channelId?: string;
  channelTitle?: string;
}

export interface Channel {
  id: string;          // Database UUID
  channel_id: string;  // UCxx... YouTube format
  name: string;
  handle: string;
  custom_logo: string;
  banner_style: string;
  is_active?: boolean;
  order_index?: number;
}

export interface VideoContentPage {
  items: VideoItem[];
  nextPageToken: string;
  channelLogo: string;
  channelTitle: string;
}

export interface FavoritesData {
  items: VideoItem[];
  favoriteIds: string[];
}

export interface Notification {
  message: string;
  type: "success" | "error";
}

export const TABS = [
  { id: "videos",    label: "Videos",    icon: "Play"   },
  { id: "playlists", label: "Playlists", icon: "Layers" },
  { id: "favorites", label: "Favorites", icon: "Heart"  },
] as const;

export type TabId = (typeof TABS)[number]["id"];
