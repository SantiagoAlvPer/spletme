export type CollaboratorStatus = "active" | "pending" | "no_wallet";

export interface RecentSong {
  title: string;
  streams: string;
  percentage: number;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  songs: number;
  songPresencePercentage: number;
  avgSplitPercentage: number;
  paid: number;
  status: CollaboratorStatus;
  role?: string;
  recentSongs?: RecentSong[];
}

export interface CollaboratorPayment {
  id: string;
  collaboratorName: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  songTitle: string;
  isrc: string;
  relativeDate: string;
  date: string;
  amount: number;
  status: "completed" | "processing" | "failed";
}

// ── Detail modal types ────────────────────────────────────────────────────────

export interface ApiSong {
  songId: string;
  trackTitle: string;
  artistName: string;
  isrc: string;
  upc: string;
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  split: { splitId: string; percentage: number } | null;
}

export interface ApiParticipation {
  songCount: number;
  ownerTotalSongs: number;
  presencePercentage: number;
  avgSplitPercentage: number | null;
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
}

export interface ApiCollaboratorDetail {
  userId: string;
  userExternalId?: string;
  email: string;
  name: string;
  role: string;
  invitedBy: { _id: string; name: string; email: string } | null;
  createdAt: string;
  participation: ApiParticipation;
  songs: ApiSong[];
}

export interface SplitHistoryEntry {
  _id: string;
  action: "create" | "update" | "delete";
  isDeleted: boolean;
  collaboratorId: string;
  conditions: Array<{
    percentage: number;
    countriesType: string;
    selectedCountries: string[];
    selectedPlatforms: string[];
  }>;
  createdAt: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  songId: { _id: string; isrc: string; artistName: string; trackTitle: string; upc: string };
  splitId: string;
  updatedAt: string;
  updatedBy: { _id: string; name: string; email: string };
}

export interface PlatformEntry {
  platform: string;
  streams: number;
  netIncome: number;
  grossIncome: number;
}

export interface SongMetrics {
  songId: string;
  trackTitle: string;
  artistName: string;
  isrc: string;
  upc: string;
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  byPlatform: PlatformEntry[];
  split: {
    splitId: string;
    percentage: number;
    totalOwed: number;
    totalPaid: number;
    pendingAmount: number;
  } | null;
}

export interface CollaboratorTotals {
  totalStreams: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  totalOwed: number;
  totalPaid: number;
  pendingAmount: number;
  byPlatform: PlatformEntry[];
}

export interface CollaboratorMetrics {
  songs: SongMetrics[];
  totals: CollaboratorTotals;
}
