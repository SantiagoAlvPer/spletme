import { Crown, Music } from "lucide-react";
import { formatCompactCurrency } from "@/utils/collaborators.utils";
import type { Collaborator } from "@/types";

interface FeaturedCollaboratorCardProps {
  collaborator: Collaborator;
  onViewProfile: () => void;
}

/**
 * Tarjeta de detalle del colaborador seleccionado.
 * Muestra avatar, stats, canciones recientes y acciones rápidas.
 */
export function FeaturedCollaboratorCard({ collaborator, onViewProfile }: FeaturedCollaboratorCardProps) {
  return (
    <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      <div className="relative h-[140px] bg-[#0F172A] flex items-start justify-center pt-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 h-[22px] bg-[#1E293B] rounded-full">
          <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full" />
          <span className="text-[10px] font-bold text-[#F97316] tracking-wider">COLABORADOR DESTACADO</span>
        </span>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 w-24 h-24 bg-white rounded-full p-1 shadow-sm">
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ backgroundColor: collaborator.avatarBg }}
          >
            <span className="text-[28px] font-bold" style={{ color: collaborator.avatarText }}>
              {collaborator.initials}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pt-16 pb-6 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-lg font-bold text-[#111827]">{collaborator.name}</h3>
          <p className="text-xs text-[#6B7280]">{collaborator.email}</p>
        </div>

        {collaborator.role && (
          <span className="inline-flex items-center gap-1.5 px-2.5 h-6 bg-orange-50 rounded-full">
            <Crown className="w-3 h-3 text-[#F97316]" />
            <span className="text-[11px] font-semibold text-orange-900">{collaborator.role}</span>
          </span>
        )}

        <div className="grid grid-cols-3 w-full border-y border-gray-100">
          <div className="flex flex-col items-center gap-1 py-3">
            <span className="text-xl font-bold text-[#111827]">{collaborator.songs}</span>
            <span className="text-[10px] text-[#6B7280]">Canciones</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 border-x border-gray-100">
            <span className="text-xl font-bold text-[#F97316]">
              {collaborator.avgSplitPercentage > 0
                ? `${(collaborator.avgSplitPercentage * 100).toFixed(1)}%`
                : "—"}
            </span>
            <span className="text-[10px] text-[#6B7280]">Split avg</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3">
            <span className="text-xl font-bold text-green-500">{formatCompactCurrency(collaborator.paid)}</span>
            <span className="text-[10px] text-[#6B7280]">Pagado</span>
          </div>
        </div>

        {collaborator.recentSongs && collaborator.recentSongs.length > 0 && (
          <div className="w-full flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider">CANCIONES RECIENTES</span>
            <div className="flex flex-col gap-2">
              {collaborator.recentSongs.map((song) => (
                <div key={song.title} className="flex items-center gap-3 px-3 h-12 bg-[#F9FAFB] rounded-lg">
                  <div className="w-7 h-7 bg-orange-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <Music className="w-3.5 h-3.5 text-[#F97316]" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#111827] truncate">{song.title}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{song.streams}</span>
                  </div>
                  <span className="text-xs font-bold text-[#F97316]">{song.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex items-center gap-2">
          <button
            onClick={onViewProfile}
            className="flex-1 h-10 bg-[#F97316] hover:bg-orange-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            Ver perfil
          </button>
          <button className="flex-1 h-10 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-[13px] font-semibold rounded-lg transition-colors">
            Pagar split
          </button>
        </div>
      </div>
    </div>
  );
}
