import { Crown, X, Globe, Percent, Music, Save, AlertCircle } from "lucide-react";
import Select from "react-select";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FilterSegment } from "@/components/ui/FilterSegment";
import { selectStyles } from "@/components/ui/selectStyles";
import { useReleaseFilters } from "@/hooks/useReleaseFilters";
import { songSplitsService } from "@/services/songSplits";
import type { FilterType, SelectOption, SongSplit } from "@/types";

interface OwnerSplitModalSong {
  trackTitle?: string;
  ownerId?: { split?: SongSplit | null } | string;
}

interface OwnerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  song: OwnerSplitModalSong;
  onSplitCreated?: () => void;
}

interface OwnerFormData {
  percentage: string;
  countriesType: FilterType;
  selectedCountries: SelectOption[];
  platformsType: FilterType;
  selectedPlatforms: SelectOption[];
}

const toSelectOptions = (values: string[]): SelectOption[] =>
  (values ?? []).map((value) => ({ value, label: value }));

const defaultForm = (): OwnerFormData => ({
  percentage: "",
  countriesType: "all",
  selectedCountries: [],
  platformsType: "all",
  selectedPlatforms: [],
});

export default function OwnerSplitModal({
  isOpen,
  onClose,
  songId,
  song,
  onSplitCreated,
}: OwnerSplitModalProps) {
  const [form, setForm] = useState<OwnerFormData>(defaultForm());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { countryOptions, platformOptions, isLoadingFilters } = useReleaseFilters(
    songId,
    isOpen
  );

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);

    const ownerId = song?.ownerId;
    const split =
      ownerId && typeof ownerId === "object" ? ownerId.split ?? null : null;

    if (!split) {
      setForm(defaultForm());
      return;
    }

    setForm({
      percentage: String(split.percentage ?? ""),
      countriesType: split.countriesType ?? "all",
      selectedCountries: toSelectOptions(split.selectedCountries ?? []),
      platformsType: split.platformsType ?? "all",
      selectedPlatforms: toSelectOptions(split.selectedPlatforms ?? []),
    });
  }, [isOpen, song]);

  const updateForm = (
    field: keyof OwnerFormData,
    value: string | readonly SelectOption[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasExistingSplit = Boolean(
    song?.ownerId && typeof song.ownerId === "object" && song.ownerId.split
  );

  const saveOwnerSplit = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!songId) {
        setErrorMessage("ID de canción no válido.");
        return;
      }

      const pct = parseFloat(form.percentage);
      if (!pct || pct < 1 || pct > 100) {
        setErrorMessage("El porcentaje debe estar entre 1 y 100.");
        return;
      }

      await songSplitsService.createOwnerSplit({
        songId,
        percentage: pct,
        countriesType: form.countriesType,
        selectedCountries: form.selectedCountries.map((c) => c.value),
        platformsType: form.platformsType,
        selectedPlatforms: form.selectedPlatforms.map((p) => p.value),
      });

      if (onSplitCreated) onSplitCreated();
      onClose();
    } catch (error: unknown) {
      const err = error as {
        response?: { status: number; data?: { message?: string; error?: string } };
        message?: string;
      };
      if (err.response?.data) {
        const msg = err.response.data.message ?? err.response.data.error ?? "Error del servidor.";
        setErrorMessage(`Error ${err.response.status}: ${msg}`);
      } else {
        setErrorMessage(err.message ?? "Error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F97316] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold text-base leading-tight">Owner Split</h2>
                {hasExistingSplit && (
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-semibold rounded-full">
                    Editando
                  </span>
                )}
              </div>
              <p className="text-white/80 text-xs mt-0.5 truncate max-w-xs">
                {song?.trackTitle || "Canción"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <Percent className="w-3.5 h-3.5" />
                Porcentaje del owner
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  value={form.percentage}
                  onChange={(e) => updateForm("percentage", e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#F97316] transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <Globe className="w-3.5 h-3.5" />
                Países
              </label>
              <FilterSegment
                value={form.countriesType}
                onChange={(v) => updateForm("countriesType", v)}
                labels={{ all: "Todos", except: "Excepto", only: "Solo" }}
                name="owner-países"
              />
              {form.countriesType !== "all" && (
                <Select
                  isMulti
                  isLoading={isLoadingFilters}
                  options={countryOptions}
                  value={form.selectedCountries}
                  onChange={(selected) => updateForm("selectedCountries", selected ?? [])}
                  styles={selectStyles}
                  placeholder="Seleccionar países..."
                  noOptionsMessage={() => "No hay países disponibles"}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <Music className="w-3.5 h-3.5" />
                Plataformas
              </label>
              <FilterSegment
                value={form.platformsType}
                onChange={(v) => updateForm("platformsType", v)}
                labels={{ all: "Todas", except: "Excepto", only: "Solo" }}
                name="owner-plataformas"
              />
              {form.platformsType !== "all" && (
                <Select
                  isMulti
                  isLoading={isLoadingFilters}
                  options={platformOptions}
                  value={form.selectedPlatforms}
                  onChange={(selected) => updateForm("selectedPlatforms", selected ?? [])}
                  styles={selectStyles}
                  placeholder="Seleccionar plataformas..."
                  noOptionsMessage={() => "No hay plataformas disponibles"}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
          {errorMessage && (
            <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{errorMessage}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveOwnerSplit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? "Guardando..." : hasExistingSplit ? "Actualizar Split" : "Crear Split"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
