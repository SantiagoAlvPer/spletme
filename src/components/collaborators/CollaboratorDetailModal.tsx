import { useEffect, useState } from "react";
import {
  X,
  Crown,
  Mail,
  Music,
  Calendar,
  UserCheck,
  DollarSign,
  Headphones,
  ChevronRight,
  BarChart2,
  History,
  ArrowLeft,
} from "lucide-react";
import CollaboratorService from "@/services/collaborator";
import { splitsService } from "@/services/splits";
import type { Collaborator } from "@/types";
import type {
  ApiSong,
  ApiCollaboratorDetail,
  SplitHistoryEntry,
  CollaboratorMetrics,
} from "@/types/collaborator.types";

interface CollaboratorDetailModalProps {
  collaborator: Collaborator;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const ACTION_STYLES: Record<string, { label: string; cls: string }> = {
  create: { label: "Creado", cls: "bg-green-50 text-[#8B5CF6]" },
  update: { label: "Actualizado", cls: "bg-orange-50 text-[#F97316]" },
  delete: { label: "Eliminado", cls: "bg-red-50 text-red-500" },
};

const PLATFORM_META: Record<
  string,
  { name: string; color: string; bg: string }
> = {
  spotify: { name: "Spotify", color: "#1DB954", bg: "#F0FDF4" },
  apple_music: { name: "Apple Music", color: "#FC3C44", bg: "#FFF1F2" },
  applemusic: { name: "Apple Music", color: "#FC3C44", bg: "#FFF1F2" },
  apple: { name: "Apple Music", color: "#FC3C44", bg: "#FFF1F2" },
  youtube_music: { name: "YouTube Music", color: "#FF0000", bg: "#FFF1F2" },
  youtubemusic: { name: "YouTube Music", color: "#FF0000", bg: "#FFF1F2" },
  youtube: { name: "YouTube Music", color: "#FF0000", bg: "#FFF1F2" },
  amazon_music: { name: "Amazon Music", color: "#00A8E1", bg: "#F0F9FF" },
  amazonmusic: { name: "Amazon Music", color: "#00A8E1", bg: "#F0F9FF" },
  amazon: { name: "Amazon Music", color: "#00A8E1", bg: "#F0F9FF" },
  tidal: { name: "Tidal", color: "#000000", bg: "#F3F4F6" },
  deezer: { name: "Deezer", color: "#A238FF", bg: "#F5F3FF" },
  pandora: { name: "Pandora", color: "#3668FF", bg: "#EFF6FF" },
  soundcloud: { name: "SoundCloud", color: "#FF5500", bg: "#FFF7ED" },
  napster: { name: "Napster", color: "#009BDE", bg: "#F0F9FF" },
  iheartradio: { name: "iHeartRadio", color: "#C6002B", bg: "#FFF1F2" },
  vevo: { name: "Vevo", color: "#E31837", bg: "#FFF1F2" },
  audiomack: { name: "Audiomack", color: "#FFA500", bg: "#FFFBEB" },
  anghami: { name: "Anghami", color: "#5C2D91", bg: "#FAF5FF" },
  boomplay: { name: "Boomplay", color: "#FF6B35", bg: "#FFF7ED" },
  tiktok: { name: "TikTok", color: "#010101", bg: "#F3F4F6" },
  facebook: { name: "Facebook", color: "#1877F2", bg: "#EFF6FF" },
  instagram: { name: "Instagram", color: "#E1306C", bg: "#FFF1F2" },
  shazam: { name: "Shazam", color: "#0088FF", bg: "#EFF6FF" },
  kkbox: { name: "KKBOX", color: "#00B060", bg: "#F0FDF4" },
  joox: { name: "JOOX", color: "#00CC00", bg: "#F0FDF4" },
  gaana: { name: "Gaana", color: "#E72C30", bg: "#FFF1F2" },
  jiosaavn: { name: "JioSaavn", color: "#2BC5B4", bg: "#F0FDFA" },
  wynk: { name: "Wynk Music", color: "#1B2D7F", bg: "#EFF6FF" },
  hungama: { name: "Hungama", color: "#E4002B", bg: "#FFF1F2" },
  melon: { name: "Melon", color: "#00CD3C", bg: "#F0FDF4" },
  bugs: { name: "Bugs!", color: "#FF6600", bg: "#FFF7ED" },
  genie: { name: "Genie Music", color: "#00ADEF", bg: "#F0F9FF" },
  flo: { name: "FLO", color: "#FF4867", bg: "#FFF1F2" },
  vibe: { name: "Naver Vibe", color: "#03C75A", bg: "#F0FDF4" },
};

const getPlatformMeta = (raw: string) => {
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    PLATFORM_META[raw.toLowerCase()] ??
    PLATFORM_META[key] ??
    { name: raw.charAt(0).toUpperCase() + raw.slice(1), color: "#6B7280", bg: "#F9FAFB" }
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CollaboratorDetailModal({
  collaborator,
  onClose,
}: CollaboratorDetailModalProps) {
  const [detail, setDetail] = useState<ApiCollaboratorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSong, setSelectedSong] = useState<ApiSong | null>(null);

  const [metrics, setMetrics] = useState<CollaboratorMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [history, setHistory] = useState<SplitHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterSongId, setFilterSongId] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Load collaborator detail
  useEffect(() => {
    CollaboratorService.getById(collaborator.id).then((response) => {
      const payload: ApiCollaboratorDetail | null = response?.data ?? null;
      if (payload) setDetail(payload);
      else setError(true);
      setLoading(false);
    });
  }, [collaborator.id]);

  // Load metrics once when panel opens
  useEffect(() => {
    if (!selectedSong || metrics) return;
    setMetricsLoading(true);
    CollaboratorService.getSongMetrics(collaborator.id)
      .then((res) => setMetrics(res?.data ?? null))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, [selectedSong]);

  // Set song filter to selected song by default
  useEffect(() => {
    if (selectedSong) setFilterSongId(selectedSong.songId);
  }, [selectedSong]);

  // Load history when a song is selected
  useEffect(() => {
    if (!selectedSong) return;
    setHistory([]);
    setHistoryLoading(true);
    splitsService
      .getUserSplitHistory(collaborator.id)
      .then((rows) =>
        setHistory((rows ?? []) as unknown as SplitHistoryEntry[]),
      )
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selectedSong]);

  // Use metrics.totals when available, fall back to detail.songs
  const collaboratorTotalStreams =
    metrics?.totals.totalStreams ??
    detail?.songs.reduce((s, x) => s + (x.totalStreams ?? 0), 0) ??
    0;
  const collaboratorTotalNet =
    metrics?.totals.totalNetIncome ??
    detail?.songs.reduce((s, x) => s + (x.totalNetIncome ?? 0), 0) ??
    0;
  const songStreams = selectedSong?.totalStreams ?? 0;
  const songNet = selectedSong?.totalNetIncome ?? 0;
  const maxStreams = Math.max(collaboratorTotalStreams, songStreams, 1);

  // Platform data from metrics endpoint
  const selectedSongMetrics = metrics?.songs.find(
    (s) => s.songId === selectedSong?.songId,
  );
  const songPlatforms = selectedSongMetrics?.byPlatform ?? [];
  const globalPlatforms = metrics?.totals.byPlatform ?? [];
  const maxPlatformStreams = Math.max(
    ...songPlatforms.map((p) => p.streams),
    1,
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center gap-4 px-4 overflow-x-auto"
      onClick={onClose}
    >
      {/* ── Main modal ─────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-shrink-0 transition-all duration-300"
        style={{ width: 860, height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#F97316] rounded-full" />
            <span className="text-xs font-bold text-[#F97316] tracking-wider">
              PERFIL DEL COLABORADOR
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* ── Profile panel ── */}
          <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-100 bg-[#FAFAFA] overflow-y-auto">
            {/* Avatar + identity */}
            <div className="flex flex-col items-center gap-3 px-6 py-7 border-b border-gray-100">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: collaborator.avatarBg }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: collaborator.avatarText }}
                >
                  {collaborator.initials}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 w-full">
                <h3 className="text-base font-bold text-[#111827] text-center">
                  {detail?.name ?? collaborator.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[180px]">
                    {detail?.email ?? collaborator.email}
                  </span>
                </div>
              </div>
              {(detail?.role ?? collaborator.role) && (
                <span className="inline-flex items-center gap-1.5 px-3 h-7 bg-orange-50 border border-orange-100 rounded-full">
                  <Crown className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="text-xs font-semibold text-orange-900 capitalize">
                    {detail?.role ?? collaborator.role}
                  </span>
                </span>
              )}
            </div>

            {/* Meta info */}
            {detail && (detail.invitedBy || detail.createdAt) && (
              <div className="flex flex-col gap-2.5 px-5 py-5">
                <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">
                  INFO
                </span>
                <div className="flex flex-col gap-3">
                  {detail.createdAt && (
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-[#9CA3AF] mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#9CA3AF]">
                          Miembro desde
                        </span>
                        <span className="text-xs font-semibold text-[#374151]">
                          {fmtDate(detail.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                  {detail.invitedBy && (
                    <div className="flex items-start gap-2.5">
                      <UserCheck className="w-4 h-4 text-[#9CA3AF] mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-[#9CA3AF]">
                          Invitado por
                        </span>
                        <span className="text-xs font-semibold text-[#374151] truncate">
                          {detail.invitedBy.name}
                        </span>
                        <span className="text-[11px] text-[#9CA3AF] truncate">
                          {detail.invitedBy.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participation stats */}
            {detail?.participation && (
              <div className="flex flex-col gap-2.5 px-5 py-5 border-b border-gray-100">
                <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">
                  PARTICIPACIÓN
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: "Canciones",
                      value: `${detail.participation.songCount} de ${detail.participation.ownerTotalSongs}`,
                      cls: "text-[#111827]",
                    },
                    {
                      label: "Presencia",
                      value: `${(detail.participation.presencePercentage * 100).toFixed(2)}%`,
                      cls: "text-[#06B6D4]",
                    },
                    {
                      label: "Split promedio",
                      value: `${detail.participation.avgSplitPercentage}%`,
                      cls: "text-[#F97316]",
                    },
                    {
                      label: "Streams totales",
                      value:
                        detail.participation.totalStreams.toLocaleString(
                          "en-US",
                        ),
                      cls: "text-[#8B5CF6]",
                    },
                  ].map(({ label, value, cls }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 h-10 bg-white rounded-xl border border-gray-100"
                    >
                      <span className="text-xs text-[#6B7280]">{label}</span>
                      <span className={`text-sm font-bold ${cls}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split overview from metrics */}
            {metrics?.totals && (
              <div className="flex flex-col gap-2.5 px-5 py-5 border-b border-gray-100">
                <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">
                  SPLITS — PAGOS
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: "Total adeudado",
                      value: fmt(metrics.totals.totalOwed),
                      color: "#F97316",
                    },
                    {
                      label: "Total pagado",
                      value: fmt(metrics.totals.totalPaid),
                      color: "#34D399",
                    },
                    {
                      label: "Pendiente",
                      value: fmt(metrics.totals.pendingAmount),
                      color: "#F43F5E",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 h-10 bg-white rounded-xl border border-gray-100"
                    >
                      <span className="text-xs text-[#6B7280]">{label}</span>
                      <span className="text-sm font-bold" style={{ color }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Songs panel ── */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
              <span className="text-xs font-bold text-[#9CA3AF] tracking-wider">
                CANCIONES
              </span>
              {detail && (
                <span className="text-xs text-[#9CA3AF]">
                  {detail.songs.length} en total
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && error && (
                <p className="text-sm text-red-400 text-center py-4">
                  Error al cargar.
                </p>
              )}
              {!loading &&
                !error &&
                detail?.songs.map((song) => {
                  const isSelected = selectedSong?.songId === song.songId;
                  return (
                    <button
                      key={song.songId}
                      onClick={() => setSelectedSong(isSelected ? null : song)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
                        isSelected
                          ? "bg-orange-50 border-orange-200"
                          : "bg-[#F9FAFB] border-gray-100 hover:border-orange-200 hover:bg-orange-50/40"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#F97316]" : "bg-orange-100 group-hover:bg-[#F97316]"}`}
                      >
                        <Music
                          className={`w-4 h-4 transition-colors ${isSelected ? "text-white" : "text-[#F97316] group-hover:text-white"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${isSelected ? "text-[#F97316]" : "text-[#111827]"}`}
                        >
                          {song.trackTitle}
                        </p>
                        <p className="text-xs text-[#6B7280] truncate">
                          {song.artistName}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] font-mono">
                          {song.isrc}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {song.split ? (
                          <>
                            <span
                              className={`text-sm font-bold ${isSelected ? "text-[#F97316]" : "text-[#9CA3AF]"}`}
                            >
                              {song.split.percentage}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">
                            Sin split
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-colors ${isSelected ? "text-[#F97316]" : "text-gray-300 group-hover:text-[#F97316]"}`}
                        />
                      </div>
                    </button>
                  );
                })}
              {!loading && !error && detail?.songs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9CA3AF]">
                  <Music className="w-8 h-8" />
                  <p className="text-sm">Sin canciones asociadas</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full h-10 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-sm font-semibold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Metrics modal — slides in from right ───────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: selectedSong ? 700 : 0,
          height: "90vh",
          opacity: selectedSong ? 1 : 0,
          pointerEvents: selectedSong ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedSong && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate max-w-[280px]">
                    {selectedSong.trackTitle}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {selectedSong.artistName} · {selectedSong.isrc}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedSong.split && (
                  <span className="text-xs font-bold text-white bg-[#F97316] px-2.5 h-6 rounded-full flex items-center">
                    {selectedSong.split.percentage}%
                  </span>
                )}
                <button
                  onClick={() => setSelectedSong(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Two columns */}
            <div className="flex flex-1 min-h-0 divide-x divide-gray-100">
              {/* Performance — built from detail.songs */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="text-[11px] font-bold text-[#374151] tracking-wider">
                    RENDIMIENTO
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Streams canción",
                        value: songStreams.toLocaleString("en-US"),
                        sub: "streams totales",
                        color: "#F97316",
                      },
                      {
                        label: "Streams totales",
                        value: collaboratorTotalStreams.toLocaleString("en-US"),
                        sub: "todas sus canciones",
                        color: "#06B6D4",
                      },
                      {
                        label: "Neto canción",
                        value: fmt(songNet),
                        sub: "neto generado",
                        color: "#C084FC",
                      },
                      {
                        label: "Neto total",
                        value: fmt(collaboratorTotalNet),
                        sub: "todas sus canciones",
                        color: "#8B5CF6",
                      },
                    ].map(({ label, value, sub, color }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-0.5 px-3 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-100"
                      >
                        <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">
                          {label}
                        </span>
                        <span className="text-sm font-bold" style={{ color }}>
                          {value}
                        </span>
                        <span className="text-[9px] text-[#9CA3AF]">{sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Split financials from metrics */}
                  {selectedSongMetrics?.split && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider">
                        SPLIT — {selectedSongMetrics.split.percentage}%
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          {
                            label: "Adeudado",
                            value: fmt(selectedSongMetrics.split.totalOwed),
                            color: "#F97316",
                          },
                          {
                            label: "Pagado",
                            value: fmt(selectedSongMetrics.split.totalPaid),
                            color: "#34D399",
                          },
                          {
                            label: "Pendiente",
                            value: fmt(selectedSongMetrics.split.pendingAmount),
                            color: "#F43F5E",
                          },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className="flex flex-col gap-0.5 px-2.5 py-2 bg-[#F9FAFB] rounded-xl border border-gray-100"
                          >
                            <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">
                              {label}
                            </span>
                            <span
                              className="text-[11px] font-bold"
                              style={{ color }}
                            >
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison bars */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider">
                      COMPARATIVA DE STREAMS
                    </span>
                    <div className="flex flex-col gap-1.5 px-3 py-3 bg-[#F9FAFB] rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#9CA3AF] w-14 flex-shrink-0">
                          Total
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#06B6D4]"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <span className="text-[9px] text-[#9CA3AF] flex-shrink-0 text-right w-16">
                          {collaboratorTotalStreams.toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#9CA3AF] w-14 flex-shrink-0">
                          Canción
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#F97316]"
                            style={{
                              width: `${(songStreams / maxStreams) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-[#F97316] font-semibold flex-shrink-0 text-right w-16">
                          {songStreams.toLocaleString("en-US")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 px-3 py-3 bg-[#F9FAFB] rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#9CA3AF] w-14 flex-shrink-0">
                          Total
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8B5CF6]"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <span className="text-[9px] text-[#9CA3AF] flex-shrink-0 text-right w-16">
                          {fmt(collaboratorTotalNet)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#9CA3AF] w-14 flex-shrink-0">
                          Canción
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#C084FC]"
                            style={{
                              width: `${(songNet / Math.max(collaboratorTotalNet, songNet, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-[#C084FC] font-semibold flex-shrink-0 text-right w-16">
                          {fmt(songNet)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* All songs ranking */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider">
                      CANCIONES DEL COLABORADOR
                    </span>
                    {detail?.songs
                      .slice()
                      .sort((a, b) => b.totalStreams - a.totalStreams)
                      .map((song) => {
                        const isThis = song.songId === selectedSong?.songId;
                        const pct = (song.totalStreams / maxStreams) * 100;
                        return (
                          <div
                            key={song.songId}
                            className={`flex flex-col gap-1 px-2.5 py-2 rounded-lg border ${isThis ? "bg-orange-50 border-orange-200" : "bg-[#F9FAFB] border-gray-100"}`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-semibold truncate max-w-[120px] ${isThis ? "text-[#F97316]" : "text-[#374151]"}`}
                              >
                                {song.trackTitle}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF]">
                                {song.totalStreams.toLocaleString("en-US")}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: isThis
                                    ? "#F97316"
                                    : "#34D399",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Platform breakdown from /metrics endpoint */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider">
                      DESGLOSE POR PLATAFORMA
                    </span>
                    {metricsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-4 h-4 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : songPlatforms.length === 0 ? (
                      <p className="text-[10px] text-[#9CA3AF] text-center py-3">
                        Sin datos de plataformas
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {/* Song platforms */}
                        {songPlatforms
                          .slice()
                          .sort((a, b) => b.streams - a.streams)
                          .map((p) => {
                            const meta = getPlatformMeta(p.platform);
                            const globalEntry = globalPlatforms.find(
                              (g) => g.platform === p.platform,
                            );
                            const totalStreams = globalEntry?.streams ?? 0;
                            // Total is always the max, so total bar = 100% and song bar is relative to it
                            const songPct =
                              totalStreams > 0
                                ? (p.streams / totalStreams) * 100
                                : 0;
                            return (
                              <div
                                key={p.platform}
                                className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border border-gray-100"
                                style={{ backgroundColor: meta.bg }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: meta.color }}
                                  />
                                  <span
                                    className="text-[11px] font-bold"
                                    style={{ color: meta.color }}
                                  >
                                    {meta.name}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white rounded-lg border border-gray-100">
                                    <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">
                                      Str. total
                                    </span>
                                    <div className="flex items-center gap-1" style={{ color: meta.color }}>
                                      <Headphones className="w-2.5 h-2.5" />
                                      <span className="text-[10px] font-bold">
                                        {totalStreams.toLocaleString("en-US")}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white rounded-lg border border-gray-100">
                                    <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">
                                      Str. canción
                                    </span>
                                    <div className="flex items-center gap-1" style={{ color: meta.color }}>
                                      <Headphones className="w-2.5 h-2.5 opacity-60" />
                                      <span className="text-[10px] font-bold opacity-80">
                                        {p.streams.toLocaleString("en-US")}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white rounded-lg border border-gray-100">
                                    <span className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">
                                      Neto
                                    </span>
                                    <div className="flex items-center gap-1 text-[#8B5CF6]">
                                      <DollarSign className="w-2.5 h-2.5" />
                                      <span className="text-[10px] font-bold">
                                        {fmt(p.netIncome)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-[#9CA3AF] w-12 flex-shrink-0">
                                      Total
                                    </span>
                                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full opacity-40"
                                        style={{
                                          width: "100%",
                                          backgroundColor: meta.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-[#9CA3AF] w-12 flex-shrink-0">
                                      Canción
                                    </span>
                                    <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${songPct}%`,
                                          backgroundColor: meta.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <History className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="text-[11px] font-bold text-[#374151] tracking-wider">
                    HISTORIAL DE SPLITS
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0 bg-[#FAFAFA]">
                  <select
                    value={filterSongId}
                    onChange={(e) => setFilterSongId(e.target.value)}
                    className="w-full h-8 px-2 py-1 text-[11px] bg-white border border-gray-200 rounded-lg text-[#374151] focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="all" className="text-[#374151] ">
                      Todas las canciones
                    </option>
                    {detail?.songs.map((s) => (
                      <option key={s.songId} value={s.songId}>
                        {s.trackTitle}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filterFrom}
                      onChange={(e) => setFilterFrom(e.target.value)}
                      className="flex-1 h-8 px-2 text-[11px] bg-white border border-gray-200 rounded-lg text-[#374151] focus:outline-none focus:border-[#F97316]"
                      placeholder="Desde"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">—</span>
                    <input
                      type="date"
                      value={filterTo}
                      onChange={(e) => setFilterTo(e.target.value)}
                      className="flex-1 h-8 px-2 text-[11px] bg-white border border-gray-200 rounded-lg text-[#374151] focus:outline-none focus:border-[#F97316]"
                      placeholder="Hasta"
                    />
                    {(filterFrom || filterTo) && (
                      <button
                        onClick={() => {
                          setFilterFrom("");
                          setFilterTo("");
                        }}
                        className="text-[10px] text-[#9CA3AF] hover:text-[#F97316] transition-colors px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    (() => {
                      const filtered = [
                        ...history.filter(
                          (e) => e.songId._id === selectedSong?.songId,
                        ),
                        ...history.filter(
                          (e) => e.songId._id !== selectedSong?.songId,
                        ),
                      ].filter((e) => {
                        if (
                          filterSongId !== "all" &&
                          e.songId._id !== filterSongId
                        )
                          return false;
                        const d = new Date(e.createdAt);
                        if (filterFrom && d < new Date(filterFrom))
                          return false;
                        if (filterTo && d > new Date(filterTo + "T23:59:59"))
                          return false;
                        return true;
                      });

                      if (filtered.length === 0)
                        return (
                          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9CA3AF]">
                            <History className="w-7 h-7" />
                            <p className="text-xs">Sin resultados</p>
                          </div>
                        );

                      return (
                        <div className="flex flex-col gap-2">
                          {filtered.map((entry) => {
                            const style =
                              ACTION_STYLES[entry.action] ??
                              ACTION_STYLES.update;
                            const pct = entry.conditions?.[0]?.percentage;
                            const isThisSong =
                              entry.songId._id === selectedSong?.songId;
                            return (
                              <div
                                key={entry._id}
                                className="flex flex-col gap-1.5 px-3 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-bold px-2 h-5 rounded-full flex items-center ${style.cls}`}
                                    >
                                      {style.label}
                                    </span>
                                    {isThisSong && (
                                      <div
                                        className="w-4 h-4 bg-[#F97316] rounded-full flex items-center justify-center"
                                        title={selectedSong?.trackTitle}
                                      >
                                        <Music className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  {pct !== undefined && (
                                    <span className="text-xs font-bold text-[#F97316]">
                                      {pct}%
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 text-[10px] text-[#6B7280]">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    <span>{fmtDate(entry.createdAt)}</span>
                                  </div>
                                  {!isThisSong && entry.songId?.trackTitle && (
                                    <span className="truncate">
                                      Canción:{" "}
                                      <span className="font-semibold text-[#374151]">
                                        {entry.songId.trackTitle}
                                      </span>
                                    </span>
                                  )}
                                  {entry.updatedBy?.name && (
                                    <span className="truncate">
                                      Por:{" "}
                                      <span className="font-semibold text-[#374151]">
                                        {entry.updatedBy.name}
                                      </span>
                                    </span>
                                  )}
                                  {entry.updatedBy?.email && (
                                    <span className="truncate text-[#9CA3AF]">
                                      {entry.updatedBy.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setSelectedSong(null)}
                className="w-full h-9 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-[12px] font-semibold rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al perfil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
