import { MoreHorizontal } from "lucide-react";
import { getStatusBadge} from "@/utils/collaborators.utils";
import type { Collaborator } from "@/types";

interface CollaboratorTableRowProps {
  collaborator: Collaborator;
  isActive: boolean;
  onClick: (id: string) => void;
}

/**
 * Fila individual de la tabla de colaboradores con avatar, stats y estado.
 */
export function CollaboratorTableRow({
  collaborator,
  isActive,
  onClick,
}: CollaboratorTableRowProps) {
  const badge = getStatusBadge(collaborator.status);

  return (
    <tr
      onClick={() => onClick(collaborator.id)}
      className={`border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
        isActive ? "bg-orange-50/40" : "hover:bg-gray-50"
      }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: collaborator.avatarBg }}
          >
            <span
              className="text-[12px] font-bold"
              style={{ color: collaborator.avatarText }}
            >
              {collaborator.initials}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[13px] font-semibold text-[#111827] truncate">
              {collaborator.name}
            </span>
            <span className="text-[11px] text-[#9CA3AF] truncate">
              {collaborator.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-[13px] text-center font-semibold text-[#111827]">
        {collaborator.songs}
      </td>
      <td className="px-3 py-4 text-[13px] text-center font-semibold text-[#F97316]">
        {collaborator.avgSplitPercentage > 0
          ? `${(collaborator.avgSplitPercentage * 100).toFixed(1)}%`
          : "—"}
      </td>
      <td className="px-3 py-4 text-[13px] text-center font-semibold text-[#F97316]">
        {(collaborator.role ?? "—").toUpperCase()}
      </td>
      <td className="px-3 py-4 text-[13px] text-center font-semibold text-green-500">
        {(collaborator.paid)}
      </td>
      <td className="px-3 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${badge.bg} ${badge.text} text-[11px] font-semibold rounded-full`}
        >
          <span className={`w-1.5 h-1.5 ${badge.dot} rounded-full`} />
          {badge.label}
        </span>
      </td>
      <td className="px-3 py-4 text-center">
        <button className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
