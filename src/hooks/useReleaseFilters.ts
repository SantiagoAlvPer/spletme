import { useState, useEffect } from "react";
import SongService from "@/services/songs";
import type { SelectOption } from "@/types";

interface UseReleaseFiltersResult {
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  isLoadingFilters: boolean;
}

/**
 * Carga los países y plataformas presentes en los releases de una canción para
 * poblar los selects de configuración de splits con valores reales de la BD.
 * Solo dispara la petición cuando `enabled` es true (p. ej. al abrir el modal).
 */
export function useReleaseFilters(
  songId: string,
  enabled: boolean
): UseReleaseFiltersResult {
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [platformOptions, setPlatformOptions] = useState<SelectOption[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  useEffect(() => {
    if (!enabled || !songId) return;

    let active = true;
    setIsLoadingFilters(true);

    SongService.getReleaseFilters(songId)
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
  }, [songId, enabled]);

  return { countryOptions, platformOptions, isLoadingFilters };
}
