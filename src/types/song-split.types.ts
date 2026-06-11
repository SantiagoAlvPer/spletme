import type { FilterType } from "./splits-modal.types";

export type SplitRole = "owner" | "collaborator";

/** Referencia a usuario que el backend puede devolver poblada o como id. */
export type SplitUserRef =
  | string
  | { _id: string; id?: string; name?: string; email?: string; username?: string };

export interface SongSplit {
  _id: string;
  songId: string;
  userId: SplitUserRef;
  role: SplitRole;
  percentage: number;
  countriesType: FilterType;
  selectedCountries: string[];
  platformsType: FilterType;
  selectedPlatforms: string[];
  status: "active" | "superseded" | "deleted";
  version: number;
}

/** Campos de porcentaje + filtros que comparten owner y colaborador. */
export interface SplitFilterPayload {
  percentage: number;
  countriesType: FilterType;
  selectedCountries: string[];
  platformsType: FilterType;
  selectedPlatforms: string[];
}

export interface CreateOwnerSplitPayload extends SplitFilterPayload {
  songId: string;
}

export interface CreateCollaboratorSplitPayload extends SplitFilterPayload {
  songId: string;
  collaboratorId: string;
}

/** Entrada del desglose de distribución calculada en vivo por el backend. */
export interface SplitDistributionEntry {
  splitId: string;
  userId: SplitUserRef;
  percentage: number;
  countriesType: FilterType;
  selectedCountries: string[];
  platformsType: FilterType;
  selectedPlatforms: string[];
  amount: number;
}

export interface SongSplitDistribution {
  owner: SplitDistributionEntry | null;
  collaborators: SplitDistributionEntry[];
  songTotalNetIncome: number;
  collaboratorsPool: number;
}
