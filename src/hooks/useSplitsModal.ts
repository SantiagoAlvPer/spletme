import { useState, useEffect } from "react";
import { songSplitsService } from "@/services/songSplits";
import { useReleaseFilters } from "@/hooks/useReleaseFilters";
import type {
  CollaboratorFormData,
  CollaboratorWithSplit,
  SelectOption,
} from "@/types";

interface UseSplitsModalParams {
  isOpen: boolean;
  collaborators: CollaboratorWithSplit[];
  songId: string;
}

/** Convierte strings crudos de la BD en opciones para react-select. */
const toSelectOptions = (values: string[]): SelectOption[] =>
  (values ?? []).map((value) => ({ value, label: value }));

const defaultFormData = (): CollaboratorFormData => ({
  percentage: "",
  countriesType: "all",
  selectedCountries: [],
  platformsType: "all",
  selectedPlatforms: [],
});

/**
 * Gestiona el estado y la lógica del modal de configuración de splits de
 * colaborador. Cada colaborador tiene una sola regla: un porcentaje obligatorio
 * y filtros opcionales de país y plataforma.
 */
export function useSplitsModal({ isOpen, collaborators, songId }: UseSplitsModalParams) {
  const [collaboratorForms, setCollaboratorForms] = useState<Record<string, CollaboratorFormData>>({});
  const [expandedCollaborators, setExpandedCollaborators] = useState<Record<string, boolean>>({});
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

    const initialForms: Record<string, CollaboratorFormData> = {};

    for (const collaborator of collaborators) {
      const split = collaborator.split;
      if (!split) continue;

      initialForms[collaborator.id] = {
        percentage: String(split.percentage ?? ""),
        countriesType: split.countriesType ?? "all",
        selectedCountries: toSelectOptions(split.selectedCountries ?? []),
        platformsType: split.platformsType ?? "all",
        selectedPlatforms: toSelectOptions(split.selectedPlatforms ?? []),
      };
    }

    setCollaboratorForms(initialForms);
  }, [isOpen, collaborators]);

  const getForm = (collaboratorId: string): CollaboratorFormData =>
    collaboratorForms[collaboratorId] ?? defaultFormData();

  const toggleExpanded = (collaboratorId: string) => {
    setExpandedCollaborators((prev) => ({
      ...prev,
      [collaboratorId]: !prev[collaboratorId],
    }));
  };

  const updateForm = (
    collaboratorId: string,
    field: keyof CollaboratorFormData,
    value: string | readonly SelectOption[]
  ) => {
    setCollaboratorForms((prev) => ({
      ...prev,
      [collaboratorId]: { ...getForm(collaboratorId), [field]: value },
    }));
  };

  const saveSplit = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const pending = Object.entries(collaboratorForms).filter(
        ([, form]) => form.percentage && parseFloat(form.percentage) > 0
      );

      if (pending.length === 0) {
        setErrorMessage("Configura al menos un colaborador con un porcentaje válido.");
        return;
      }

      for (const [collaboratorId, form] of pending) {
        await songSplitsService.createCollaboratorSplit({
          songId,
          collaboratorId,
          percentage: parseFloat(form.percentage),
          countriesType: form.countriesType,
          selectedCountries: form.selectedCountries.map((c) => c.value),
          platformsType: form.platformsType,
          selectedPlatforms: form.selectedPlatforms.map((p) => p.value),
        });
      }

      setTimeout(() => window.location.reload(), 300);
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

  const configuredCount = Object.values(collaboratorForms).filter(
    (f) => f.percentage && parseFloat(f.percentage) > 0
  ).length;

  const hasAnySavedSplit = collaborators.some((c) => Boolean(c.split));

  return {
    mounted,
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    errorMessage,
    collaboratorForms,
    expandedCollaborators,
    configuredCount,
    hasAnySavedSplit,
    getForm,
    toggleExpanded,
    updateForm,
    saveSplit,
  };
}
