import type { Album } from "./album.types";
import type { SelectOption } from "./select.types";

export interface OwnerFormData {
  percentage: string;
  countriesType: "all" | "except" | "only";
  selectedCountries: SelectOption[];
  platformsType: "all" | "except" | "only";
  selectedPlatforms: SelectOption[];
}

export interface CreationProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
  errors: Array<{ songTitle: string; error: string }>;
}

export interface AlbumOwnerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
  onSplitsCreated?: () => void;
}
