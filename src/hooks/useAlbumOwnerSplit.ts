import { useState, useEffect } from "react";
import { songSplitsService } from "@/services/songSplits";
import { useReleaseFiltersForSongs } from "@/hooks/useReleaseFiltersForSongs";
import LocalStorageService from "@/services/localstorage";
import type { Album } from "@/types";
import type { OwnerFormData, CreationProgress } from "@/types/album-owner-split.types";

const DEFAULT_FORM: OwnerFormData = {
  percentage: "",
  countriesType: "all",
  selectedCountries: [],
  platformsType: "all",
  selectedPlatforms: [],
};

/**
 * Gestiona el estado y la lógica del modal de owner split por álbum completo.
 * Aplica una única regla (porcentaje + filtros opcionales país/plataforma) a
 * cada canción del álbum mediante el modelo SongSplit.
 */
export function useAlbumOwnerSplit(
  isOpen: boolean,
  album: Album,
  onClose: () => void,
  onSplitsCreated?: () => void
) {
  const [ownerForm, setOwnerForm] = useState<OwnerFormData>(DEFAULT_FORM);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<CreationProgress | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  const currentUser = LocalStorageService.getItem("user");

  const songIds = (album?.tracks ?? []).map((t) => t._id);
  const { countryOptions, platformOptions, isLoadingFilters } =
    useReleaseFiltersForSongs(songIds, isOpen);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setProgress(null);
      setShowResults(false);
      setAutoCloseCountdown(null);
      setOwnerForm(DEFAULT_FORM);
    }
  }, [isOpen]);

  // Countdown de auto-cierre al terminar sin errores
  useEffect(() => {
    if (autoCloseCountdown === null || autoCloseCountdown <= 0) {
      if (autoCloseCountdown === 0) closeWithReset();
      return;
    }
    const timer = setTimeout(() => setAutoCloseCountdown(autoCloseCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoCloseCountdown]);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const updateOwnerForm = (
    field: keyof OwnerFormData,
    value: string | readonly { value: string; label: string }[]
  ) => {
    setOwnerForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeWithReset = () => {
    const hadProgress = progress !== null;
    setProgress(null);
    setShowResults(false);
    setAutoCloseCountdown(null);
    onClose();
    if (hadProgress && onSplitsCreated) onSplitsCreated();
  };

  const createBulkOwnerSplits = async () => {
    if (!album?.tracks?.length) {
      alert("Error: No hay canciones en este álbum");
      return;
    }
    if (!currentUser?.id) {
      alert("Error: No se pudo obtener la información del usuario. Por favor, inicia sesión de nuevo.");
      return;
    }

    const pct = parseFloat(ownerForm.percentage);
    if (!pct || pct < 1 || pct > 100) {
      alert("El porcentaje debe estar entre 1 y 100");
      return;
    }

    const payloadBase = {
      percentage: pct,
      countriesType: ownerForm.countriesType,
      selectedCountries: ownerForm.selectedCountries.map((c) => c.value),
      platformsType: ownerForm.platformsType,
      selectedPlatforms: ownerForm.selectedPlatforms.map((p) => p.value),
    };

    setIsLoading(true);
    setShowResults(false);
    setProgress({ total: album.tracks.length, completed: 0, failed: 0, current: "", errors: [] });

    let localFailed = 0;

    try {
      for (const track of album.tracks) {
        setProgress((prev) => (prev ? { ...prev, current: track.trackTitle } : null));

        try {
          await songSplitsService.createOwnerSplit({ songId: track._id, ...payloadBase });
          setProgress((prev) => (prev ? { ...prev, completed: prev.completed + 1 } : null));
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? "Error desconocido";
          localFailed++;
          setProgress((prev) =>
            prev
              ? { ...prev, failed: prev.failed + 1, errors: [...prev.errors, { songTitle: track.trackTitle, error: msg }] }
              : null
          );
        }
      }

      setShowResults(true);
      if (localFailed === 0) setAutoCloseCountdown(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudieron crear los splits";
      alert(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mounted,
    ownerForm,
    isExpanded,
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    progress,
    showResults,
    autoCloseCountdown,
    currentUser,
    toggleExpanded,
    updateOwnerForm,
    createBulkOwnerSplits,
    closeWithReset,
  };
}
