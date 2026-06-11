import type { SongItem, AlbumItem } from "@/types/music.types";

/** Detecta si el item tiene un split asignado al owner */
export const hasOwnerSplit = (item: SongItem | AlbumItem): boolean =>
  Boolean(item?.ownerId?.split);

/** Detecta si el item (canción o álbum) tiene algún split configurado */
export const hasAnySplit = (item: SongItem | AlbumItem): boolean => {
  if (Boolean(item?.split) || hasOwnerSplit(item)) return true;
  if ("tracks" in item && Array.isArray(item.tracks)) {
    return item.tracks.some(
      (track) => Boolean(track?.split) || Boolean(track?.ownerId?.split)
    );
  }
  return false;
};

/** Determina si una query parece un código UPC (8-14 dígitos) */
export const looksLikeUPC = (q: string): boolean =>
  /^[0-9]{8,14}$/.test(q.replace(/\s|-/g, ""));

/** Determina si una query parece un código ISRC */
export const looksLikeISRC = (q: string): boolean =>
  /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i.test(q.replace(/\s|-/g, "").toUpperCase());

/** Formatea duración en ms o segundos como MM:SS */
export const formatDuration = (rawDuration: unknown): string => {
  if (rawDuration === undefined || rawDuration === null || rawDuration === "") return "N/A";
  const durationNumber = Number(rawDuration);
  if (Number.isNaN(durationNumber)) return String(rawDuration);
  const totalSeconds = durationNumber > 10000
    ? Math.round(durationNumber / 1000)
    : Math.round(durationNumber);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/** Normaliza una fecha de release a string legible */
export const formatReleaseDate = (rawDate: unknown): string => {
  if (!rawDate) return "N/A";
  const parsedDate = new Date(String(rawDate));
  return Number.isNaN(parsedDate.getTime()) ? String(rawDate) : parsedDate.toLocaleDateString();
};

/** Cuenta colaboradores con un split de porcentaje válido asignado */
export const countAssignedSplits = (song: SongItem): number => {
  const collaborators = song?.collaborators;
  if (Array.isArray(collaborators) && collaborators.length > 0) {
    return collaborators.filter((c) => Number(c?.split?.percentage ?? 0) > 0).length;
  }
  return Number(song?.split?.percentage ?? 0) > 0 ? 1 : 0;
};

/** Cuenta total de splits (colaboradores con split asignado) */
export const countTotalSplits = (song: SongItem): number =>
  song?.collaborators?.length ?? 0;

/** Cuenta releases de la canción */
export const countReleases = (song: SongItem): number => {
  if (Array.isArray(song?.releases)) return song.releases.length;
  const count = Number(song?.releasesCount ?? song?.totalReleases);
  return Number.isFinite(count) ? count : 0;
};
