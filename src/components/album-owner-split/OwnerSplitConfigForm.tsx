import { AnimatePresence, motion } from "framer-motion";
import { Music, Crown, Globe, Percent, Settings, ChevronDown } from "lucide-react";
import Select from "react-select";
import { amberSelectStyles } from "@/components/ui/selectStyles";
import type { OwnerFormData } from "@/types/album-owner-split.types";
import type { SelectOption } from "@/types";

interface OwnerSplitConfigFormProps {
  ownerForm: OwnerFormData;
  isExpanded: boolean;
  tracksCount: number;
  currentUser: { name?: string; email?: string } | null;
  isLoadingFilters: boolean;
  countryOptions: SelectOption[];
  platformOptions: SelectOption[];
  onToggleExpanded: () => void;
  onUpdateForm: (field: keyof OwnerFormData, value: string | readonly SelectOption[]) => void;
}

const COUNTRY_TYPE_OPTIONS = [
  { value: "all", label: "Todos los países" },
  { value: "except", label: "Excepto países seleccionados" },
  { value: "only", label: "Solo países seleccionados" },
] as const;

const PLATFORM_TYPE_OPTIONS = [
  { value: "all", label: "Todas las plataformas" },
  { value: "except", label: "Excepto plataformas seleccionadas" },
  { value: "only", label: "Solo plataformas seleccionadas" },
] as const;

/**
 * Formulario de configuración del owner split masivo por álbum: un porcentaje
 * y filtros opcionales de país y plataforma que se aplican a todas las canciones.
 */
export function OwnerSplitConfigForm({
  ownerForm,
  isExpanded,
  tracksCount,
  currentUser,
  isLoadingFilters,
  countryOptions,
  platformOptions,
  onToggleExpanded,
  onUpdateForm,
}: OwnerSplitConfigFormProps) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Creación masiva de splits</p>
          <p>La configuración que definas se aplicará a todas las {tracksCount} canciones de este álbum.</p>
        </div>
      </div>

      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
      >
        {/* Owner header — clickeable para colapsar */}
        <motion.div
          className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 cursor-pointer"
          onClick={onToggleExpanded}
          whileHover={{ backgroundColor: "rgba(245,158,11,0.05)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg"
                whileHover={{ scale: 1.1 }}
              >
                <Crown className="w-7 h-7" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{currentUser?.name ?? "Owner"}</h3>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span>{currentUser?.email}</span>
                  {ownerForm.percentage && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                      {ownerForm.percentage}%
                    </span>
                  )}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-amber-700" />
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-amber-600" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Configuración del Split</h4>
                      <p className="text-sm text-gray-600">Porcentaje del owner y filtros opcionales de país y plataforma</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Percent className="w-4 h-4" />
                        Porcentaje de Split
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          value={ownerForm.percentage}
                          onChange={(e) => onUpdateForm("percentage", e.target.value)}
                          className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-gray-900 font-medium"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</div>
                      </div>
                    </div>

                    <div className="space-y-3 col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Globe className="w-4 h-4" />
                        Configuración de Países
                      </label>
                      <div className="space-y-2">
                        {COUNTRY_TYPE_OPTIONS.map((opt) => (
                          <motion.label
                            key={opt.value}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="radio"
                              name="countries-type"
                              checked={ownerForm.countriesType === opt.value}
                              onChange={() => onUpdateForm("countriesType", opt.value)}
                              className="w-4 h-4 text-amber-500 focus:ring-amber-500/20"
                            />
                            <span className="text-sm text-gray-900">{opt.label}</span>
                          </motion.label>
                        ))}
                      </div>
                      {ownerForm.countriesType !== "all" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                          <Select
                            isMulti
                            isLoading={isLoadingFilters}
                            options={countryOptions}
                            value={ownerForm.selectedCountries}
                            onChange={(selected) => onUpdateForm("selectedCountries", selected ?? [])}
                            styles={amberSelectStyles}
                            placeholder="Seleccionar países..."
                            noOptionsMessage={() => "No hay países disponibles"}
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Music className="w-4 h-4" />
                        Configuración de Plataformas
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {PLATFORM_TYPE_OPTIONS.map((opt) => (
                          <motion.label
                            key={opt.value}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="radio"
                              name="platforms-type"
                              checked={ownerForm.platformsType === opt.value}
                              onChange={() => onUpdateForm("platformsType", opt.value)}
                              className="w-4 h-4 text-amber-500 focus:ring-amber-500/20"
                            />
                            <span className="text-sm text-gray-900">{opt.label}</span>
                          </motion.label>
                        ))}
                      </div>
                      {ownerForm.platformsType !== "all" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                          <Select
                            isMulti
                            isLoading={isLoadingFilters}
                            options={platformOptions}
                            value={ownerForm.selectedPlatforms}
                            onChange={(selected) => onUpdateForm("selectedPlatforms", selected ?? [])}
                            styles={amberSelectStyles}
                            placeholder="Seleccionar plataformas..."
                            noOptionsMessage={() => "No hay plataformas disponibles"}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
