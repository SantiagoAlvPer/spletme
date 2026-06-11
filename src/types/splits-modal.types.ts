import type { User } from "./user.types";
import type { SelectOption } from "./select.types";
import type { SongSplit } from "./song-split.types";

export type FilterType = "all" | "except" | "only";

/** Estado del formulario de split de un colaborador (una sola regla: % + filtros). */
export interface CollaboratorFormData {
  percentage: string;
  countriesType: FilterType;
  selectedCountries: SelectOption[];
  platformsType: FilterType;
  selectedPlatforms: SelectOption[];
}

export interface SplitsModalProps {
  collaborators: CollaboratorWithSplit[];
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  onSplitSaved?: (splitId: string) => void;
}

/** Colaborador con el split activo que devuelve el backend por canción. */
export interface CollaboratorWithSplit extends User {
  split?: SongSplit | null;
  amountOwed?: number;
  hasActiveSplit?: boolean;
}
