import { useState } from "react";
import { X, Music, Mail, UserPlus, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import SongService from "@/services/songs";

interface Song {
  _id: string;
  isrc: string;
  trackTitle: string;
  artistName: string;
  spotifyData?: { album?: { images?: { url: string }[] } };
}

interface InviteCollaboratorModalProps {
  song: Song;
  onClose: () => void;
  onBack: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

export function InviteCollaboratorModal({
  song,
  onClose,
  onBack,
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const cover = song.spotifyData?.album?.images?.[0]?.url ?? null;

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleInvite = async () => {
    if (!isValidEmail(email)) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await SongService.addCollaborator({
        songId: song._id,
        collaboratorEmail: email.trim().toLowerCase(),
      });
      if (res) {
        setStatus("success");
      } else {
        setErrorMsg("No se pudo enviar la invitación. Intenta de nuevo.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error al enviar la invitación.");
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0F172A]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#F97316] rounded-full" />
            <span className="text-xs font-bold text-[#F97316] tracking-wider">
              INVITAR COLABORADOR
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-6">
          {/* Song info */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-xl border border-gray-100">
            {cover ? (
              <img
                src={cover}
                alt={song.trackTitle}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-[#F97316]" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold text-[#111827] truncate">
                {song.trackTitle}
              </p>
              <p className="text-xs text-[#6B7280] truncate">{song.artistName}</p>
              <p className="text-[10px] text-[#9CA3AF] font-mono">{song.isrc}</p>
            </div>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-[#34D399]" />
              </div>
              <p className="text-sm font-bold text-[#111827]">
                ¡Invitación enviada!
              </p>
              <p className="text-xs text-[#6B7280] text-center">
                Se envió una invitación a{" "}
                <span className="font-semibold text-[#374151]">{email}</span>{" "}
                para colaborar en esta canción.
              </p>
            </div>
          ) : (
            <>
              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#374151]">
                  Correo del colaborador
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="colaborador@email.com"
                    className={`w-full h-10 pl-9 pr-3 text-sm bg-[#F9FAFB] border rounded-lg text-[#374151] placeholder-[#9CA3AF] focus:outline-none transition-colors ${
                      status === "error"
                        ? "border-red-300 focus:border-red-400"
                        : "border-gray-200 focus:border-[#F97316]"
                    }`}
                  />
                </div>
                {status === "error" && errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Se enviará una invitación al correo indicado. El colaborador
                deberá aceptarla para aparecer en la canción.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-[#374151] text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>

          {status === "success" ? (
            <button
              onClick={onClose}
              className="flex-1 h-10 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          ) : (
            <button
              onClick={handleInvite}
              disabled={status === "loading" || !email.trim()}
              className="flex-1 h-10 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Enviar invitación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
