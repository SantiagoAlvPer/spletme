export type MusicMode = "songs" | "albums";
export type SortBy =
  | "alpha" | "revenue" | "streams"
  | "title_desc"
  | "artist_asc" | "artist_desc"
  | "label_asc" | "label_desc"
  | "date_asc" | "date_desc"
  | "percentage_asc" | "percentage_desc"
  | "collaborators_asc" | "collaborators_desc"
  | "split_asc" | "split_desc";
export type SplitFilter = "all" | "with_split" | "without_split";

export interface SplitData {
  _id?: string;
  percentage?: number;
  countriesType?: "all" | "except" | "only";
  selectedCountries?: string[];
  platformsType?: "all" | "except" | "only";
  selectedPlatforms?: string[];
}

export interface SongCollaborator {
  _id?: string;
  name?: string;
  image?: string;
  split?: SplitData | null;
  amountOwed?: number;
}

export interface SongItem {
  _id: string;
  trackTitle: string;
  artistName?: string;
  isrc?: string;
  country?: string;
  upc?: string;
  ean?: string;
  streams?: number;
  netIncome?: number;
  earning?: number;
  earnings?: number;
  totalStreams?: number;
  totalNetIncome?: number;
  totalGrossIncome?: number;
  percetaje?: number;
  artisticLabel?: string;
  label?: string;
  labels?: unknown[];
  customLabels?: unknown[];
  labelNames?: unknown[];
  otherLabels?: unknown[];
  releaseDate?: string;
  release_date?: string;
  releasedAt?: string;
  release?: string;
  duration?: number;
  durationMs?: number;
  duration_ms?: number;
  releasesCount?: number;
  totalReleases?: number;
  releases?: Array<{
    upc?: string;
    releaseDate?: string;
    release_date?: string;
  }>;
  collaborators?: SongCollaborator[];
  split?: SplitData | null;
  ownerId?: { split?: SplitData | null } | null;
  spotifyData?: {
    album?: {
      images?: Array<{ url: string; width?: number; height?: number }>;
      release_date?: string;
    };
    duration_ms?: number;
  };
}

import type { Album, AlbumTrack } from "./album.types";

/** Álbum enriquecido con campos opcionales de split y datos de UI */
export interface AlbumItem extends Album {
  releaseDate?: string;
  image?: string;
  tracks: AlbumTrack[];
  split?: SplitData | null;
  ownerId?: { split?: SplitData | null } | null;
}
