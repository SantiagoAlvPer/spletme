import { useState, useEffect } from "react";
import { songSplitsService } from "@/services/songSplits";
import type { SelectOption } from "@/types";

interface UseReleaseFiltersForSongsResult {
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  isLoadingFilters: boolean;
}

/**
 * Carga la unión de países y plataformas presentes en los releases de un
 * conjunto de canciones (álbum o label) para poblar sus selects con valores
 * reales de la BD. Solo dispara la petición cuando `enabled` es true.
 */
export function useReleaseFiltersForSongs(
  songIds: string[],
  enabled: boolean
): UseReleaseFiltersForSongsResult {
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [platformOptions, setPlatformOptions] = useState<SelectOption[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // Clave estable para no re-disparar el efecto por nuevas referencias de array.
  const key = songIds.join(",");

  useEffect(() => {
    if (!enabled || songIds.length === 0) return;

    let active = true;
    setIsLoadingFilters(true);

    songSplitsService
      .getReleaseFiltersForSongs(songIds)
      .then((filters) => {
        if (!active) return;
        setCountryOptions(filters.countries);
        setPlatformOptions(filters.platforms);
      })
      .finally(() => {
        if (active) setIsLoadingFilters(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { countryOptions, platformOptions, isLoadingFilters };
}
