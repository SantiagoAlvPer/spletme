import { useState } from "react";
import { X, Music, Search, ChevronRight, UserPlus } from "lucide-react";
import UseSongs from "@/hooks/useSongs";

interface Song {
  _id: string;
  isrc: string;
  trackTitle: string;
  artistName: string;
  totalStreams: number;
  spotifyData?: { album?: { images?: { url: string }[] } };
}

interface AddCollaboratorSidebarProps {
  onClose: () => void;
  onSelectSong: (song: Song) => void;
}

export function AddCollaboratorSidebar({
  onClose,
  onSelectSong,
}: AddCollaboratorSidebarProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const LIMIT = 20;

  const {
    songs,
    loading,
    pagination,
    searchResults,
    isSearching,
    searchSongs,
    clearSearch,
  } = UseSongs(page, LIMIT);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      searchSongs(value);
    } else {
      clearSearch();
    }
  };

  const displayed: Song[] = (query.trim() ? searchResults : songs) as Song[];
  const hasMore =
    !query.trim() && (pagination?.hasMore ?? false);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative flex flex-col bg-white shadow-2xl z-10 animate-slide-in-right"
        style={{ width: 400, height: "100vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0F172A] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                Agregar Colaborador
              </span>
              <span className="text-[10px] text-gray-400">
                Selecciona una canción
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por título, artista o ISRC…"
              className="w-full h-9 pl-8 pr-3 text-xs bg-[#F9FAFB] border border-gray-200 rounded-lg text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {loading || isSearching ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9CA3AF]">
              <Music className="w-8 h-8" />
              <p className="text-sm">Sin canciones</p>
            </div>
          ) : (
            <>
              {displayed.map((song) => {
                const cover =
                  song.spotifyData?.album?.images?.[0]?.url ?? null;
                return (
                  <button
                    key={song._id}
                    onClick={() => onSelectSong(song)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-[#F9FAFB] hover:border-[#F97316] hover:bg-orange-50/40 transition-all group"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={song.trackTitle}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F97316] transition-colors">
                        <Music className="w-4 h-4 text-[#F97316] group-hover:text-white transition-colors" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {song.trackTitle}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">
                        {song.artistName}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono">
                        {song.isrc}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#F97316] flex-shrink-0 transition-colors" />
                  </button>
                );
              })}

              {hasMore && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full h-9 text-xs font-semibold text-[#F97316] border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Cargar más
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[10px] text-[#9CA3AF] text-center">
            {displayed.length} canción{displayed.length !== 1 ? "es" : ""}{" "}
            disponible{displayed.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
