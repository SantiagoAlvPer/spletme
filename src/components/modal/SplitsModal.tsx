import {
  Music,
  X,
  Globe,
  Percent,
  Users,
  ChevronDown,
  Save,
  AlertCircle,
} from "lucide-react";
import Select from "react-select";
import { createPortal } from "react-dom";
import { FilterSegment } from "@/components/ui/FilterSegment";
import { selectStyles } from "@/components/ui/selectStyles";
import { useSplitsModal } from "@/hooks/useSplitsModal";
import type { SplitsModalProps } from "@/types";

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-rose-500",
  "bg-teal-500",
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function SplitsModal({
  collaborators,
  isOpen,
  onClose,
  songId,
}: SplitsModalProps) {
  const {
    mounted,
    isLoading,
    isLoadingFilters,
    countryOptions,
    platformOptions,
    errorMessage,
    expandedCollaborators,
    configuredCount,
    hasAnySavedSplit,
    getForm,
    toggleExpanded,
    updateForm,
    saveSplit,
  } = useSplitsModal({ isOpen, collaborators, songId });

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F97316] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">Configurar Splits</h2>
              <p className="text-white/80 text-xs mt-0.5">
                {collaborators.length} colaborador{collaborators.length !== 1 ? "es" : ""} disponible
                {collaborators.length !== 1 ? "s" : ""}
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
        <div className="flex-1 overflow-y-auto bg-[#F7F8FA] p-5 space-y-3">
          {collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Sin colaboradores</p>
              <p className="text-xs text-gray-400">Agrega colaboradores a la canción primero.</p>
            </div>
          ) : (
            collaborators.map((collaborator, idx) => {
              const form = getForm(collaborator.id);
              const isExpanded = expandedCollaborators[collaborator.id] ?? false;
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const hasPercentage = form.percentage && parseFloat(form.percentage) > 0;
              const hasExistingSplit = Boolean(collaborator.split);

              return (
                <div key={collaborator.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Fila del colaborador — clickeable para expandir */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(collaborator.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{getInitials(collaborator.name ?? "?")}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{collaborator.name}</p>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasExistingSplit && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full border border-green-100">
                          Configurado
                        </span>
                      )}
                      {hasPercentage && (
                        <span className="px-2.5 py-1 bg-orange-50 text-[#F97316] text-xs font-semibold rounded-full">
                          {form.percentage}%
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Contenido expandido — una sola regla: % + filtros */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-[#F7F8FA]">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          <Percent className="w-3.5 h-3.5" />
                          Porcentaje del pool disponible
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                            value={form.percentage}
                            onChange={(e) => updateForm(collaborator.id, "percentage", e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#F97316] transition-colors bg-white"
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
                          onChange={(v) => updateForm(collaborator.id, "countriesType", v)}
                          labels={{ all: "Todos", except: "Excepto", only: "Solo" }}
                          name={`países-${collaborator.id}`}
                        />
                        {form.countriesType !== "all" && (
                          <Select
                            isMulti
                            isLoading={isLoadingFilters}
                            options={countryOptions}
                            value={form.selectedCountries}
                            onChange={(selected) => updateForm(collaborator.id, "selectedCountries", selected ?? [])}
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
                          onChange={(v) => updateForm(collaborator.id, "platformsType", v)}
                          labels={{ all: "Todas", except: "Excepto", only: "Solo" }}
                          name={`plataformas-${collaborator.id}`}
                        />
                        {form.platformsType !== "all" && (
                          <Select
                            isMulti
                            isLoading={isLoadingFilters}
                            options={platformOptions}
                            value={form.selectedPlatforms}
                            onChange={(selected) => updateForm(collaborator.id, "selectedPlatforms", selected ?? [])}
                            styles={selectStyles}
                            placeholder="Seleccionar plataformas..."
                            noOptionsMessage={() => "No hay plataformas disponibles"}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
          {errorMessage && (
            <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{errorMessage}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {configuredCount > 0 ? (
                <>
                  <span className="font-semibold text-gray-900">{configuredCount}</span>{" "}
                  colaborador{configuredCount !== 1 ? "es" : ""} configurado{configuredCount !== 1 ? "s" : ""}
                </>
              ) : (
                "Ningún colaborador configurado aún"
              )}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSplit}
                disabled={isLoading || configuredCount === 0}
                className="flex items-center gap-2 px-5 py-2 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? "Guardando..." : hasAnySavedSplit ? "Actualizar Splits" : "Guardar Splits"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
