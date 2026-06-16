import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { CollaboratorsStatsGrid } from "@/components/collaborators/CollaboratorsStatsGrid";
import { CollaboratorsTable } from "@/components/collaborators/CollaboratorsTable";
import { FeaturedCollaboratorCard } from "@/components/collaborators/FeaturedCollaboratorCard";
import { CollaboratorDetailModal } from "@/components/collaborators/CollaboratorDetailModal";
import { AddCollaboratorSidebar } from "@/components/collaborators/AddCollaboratorSidebar";
import { InviteCollaboratorModal } from "@/components/collaborators/InviteCollaboratorModal";
import { RecentPaymentsSection } from "@/components/collaborators/RecentPaymentsSection";
import type { Collaborator, CollaboratorPayment } from "@/types";
import type { ApiCollaboratorDetail } from "@/types/collaborator.types";
import CollaboratorService from "@/services/collaborator";
import type { CollaboratorListResponse } from "@/services/collaborator";

type ApiCollaborator = ApiCollaboratorDetail;

const AVATAR_PALETTE = [
  { bg: "#FED7AA", text: "#9A3412" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const adaptCollaborator = (raw: ApiCollaborator, idx: number): Collaborator => {
  const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return {
    id: raw.userId,
    name: raw.name,
    email: raw.email,
    initials: getInitials(raw.name),
    avatarBg: palette.bg,
    avatarText: palette.text,
    songs: raw.participation?.songCount ?? 0,
    songPresencePercentage: raw.participation?.presencePercentage ?? 0,
    avgSplitPercentage: raw.participation?.avgSplitPercentage ?? 0,
    paid: raw.participation?.totalNetIncome ?? 0,
    status: "active",
    role: raw.role,
  };
};

// TODO: reemplazar con endpoint de pagos cuando esté disponible
const MOCK_PAYMENTS: CollaboratorPayment[] = [
  {
    id: "p1", collaboratorName: "Lucia Reyes", initials: "LR",
    avatarBg: "#FED7AA", avatarText: "#9A3412",
    songTitle: "Solar Drift", isrc: "USRC17608123",
    relativeDate: "Hace 2 horas", date: "10 may 2026", amount: 3180, status: "completed",
  },
  {
    id: "p2", collaboratorName: "Diego Marín", initials: "DM",
    avatarBg: "#DBEAFE", avatarText: "#1E40AF",
    songTitle: "Velvet Horizon", isrc: "USRC17608124",
    relativeDate: "Ayer", date: "9 may 2026", amount: 2140.5, status: "completed",
  },
  {
    id: "p3", collaboratorName: "Ana Velasco", initials: "AV",
    avatarBg: "#FCE7F3", avatarText: "#9D174D",
    songTitle: "Echo Chambers", isrc: "USRC17608125",
    relativeDate: "Hace 3 días", date: "7 may 2026", amount: 1820.3, status: "processing",
  },
  {
    id: "p4", collaboratorName: "Mateo Salas", initials: "MS",
    avatarBg: "#D1FAE5", avatarText: "#065F46",
    songTitle: "Quiet Skylines", isrc: "USRC17608126",
    relativeDate: "Hace 5 días", date: "5 may 2026", amount: 895.4, status: "completed",
  },
];

interface SongForInvite {
  _id: string;
  isrc: string;
  trackTitle: string;
  artistName: string;
  spotifyData?: { album?: { images?: { url: string }[] } };
}

export default function Collaborators() {

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [listResponse, setListResponse] = useState<CollaboratorListResponse | null>(null);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongForInvite | null>(null);

  useEffect(() => {
    CollaboratorService.getAll().then((payload) => {
      if (payload) {
        setListResponse(payload);
        const list = payload.collaborators.map(adaptCollaborator);
        setCollaborators(list);
        if (list.length > 0) setFeaturedId(list[0].id);
      }
      setLoading(false);
    });
  }, []);

  const featured = collaborators.find((c) => c.id === featuredId) ?? collaborators[0];

  const totalSent = listResponse?.collaborators?.reduce(
    (sum, c) => sum + (c.participation?.totalNetIncome ?? 0),
    0,
  ) ?? 0;
  const activeSplits = listResponse?.collaborators?.reduce(
    (sum, c) => sum + (c.songs?.filter((s) => s.split !== null).length ?? 0),
    0,
  ) ?? 0;
  const pendingPayments = 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="px-6 lg:px-10 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-[#111827]">Colaboradores</h1>
            <p className="text-sm text-[#6B7280]">Organiza y gestiona a las personas que comparten tus regalías</p>
            <div className="w-10 h-0.5 rounded-full bg-[#F97316] mt-1" />
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-4 h-10 bg-[#F97316] hover:bg-orange-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Colaborador
          </button>
        </div>

        <CollaboratorsStatsGrid
          totalCollaborators={loading ? 0 : (listResponse?.total ?? collaborators.length)}
          totalSent={loading ? "$0.00" : `$${totalSent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          totalReceived="$0.00"
          activeSplits={loading ? 0 : activeSplits}
          pendingPayments={loading ? 0 : pendingPayments}
        />

        {!loading && collaborators.length > 0 && featured && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <CollaboratorsTable
              collaborators={collaborators}
              featuredId={featuredId ?? ""}
              onSelectCollaborator={setFeaturedId}
            />
            <FeaturedCollaboratorCard collaborator={featured} onViewProfile={() => setProfileOpen(true)} />
          </div>
        )}

        <RecentPaymentsSection payments={MOCK_PAYMENTS} />
      </div>

      {profileOpen && featured && (
        <CollaboratorDetailModal
          collaborator={featured}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {sidebarOpen && (
        <AddCollaboratorSidebar
          onClose={() => setSidebarOpen(false)}
          onSelectSong={(song) => {
            setSelectedSong(song);
            setSidebarOpen(false);
          }}
        />
      )}

      {selectedSong && (
        <InviteCollaboratorModal
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onBack={() => {
            setSelectedSong(null);
            setSidebarOpen(true);
          }}
        />
      )}
    </div>
  );
}
