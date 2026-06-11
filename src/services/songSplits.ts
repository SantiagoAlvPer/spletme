import { apiClient } from "@/infrastructure/http/axiosClient";
import type {
  CreateOwnerSplitPayload,
  CreateCollaboratorSplitPayload,
  SongSplit,
  SongSplitDistribution,
  ReleaseFiltersOptions,
} from "@/types";

const toSelectOptions = (values: string[]) =>
  (values ?? []).map((value) => ({ value, label: value }));

/**
 * Cliente del API de splits de canción (modelo SongSplit).
 * Los montos NO se almacenan: el backend los calcula en vivo desde los releases.
 */
class SongSplitsService {
  private readonly BASE = "/song-splits";

  /** Crea o actualiza (nueva versión) el split del owner de una canción. */
  async createOwnerSplit(payload: CreateOwnerSplitPayload): Promise<SongSplit> {
    const response = await apiClient.post(`${this.BASE}/owner`, payload);
    return response.data?.data ?? response.data;
  }

  /** Crea o actualiza (nueva versión) el split de un colaborador. */
  async createCollaboratorSplit(
    payload: CreateCollaboratorSplitPayload
  ): Promise<SongSplit> {
    const response = await apiClient.post(`${this.BASE}/collaborator`, payload);
    return response.data?.data ?? response.data;
  }

  /** Obtiene owner + colaboradores con sus montos calculados en vivo. */
  async getSongSplits(songId: string): Promise<SongSplitDistribution> {
    const response = await apiClient.get(`${this.BASE}/song/${songId}`);
    return response.data?.data ?? response.data;
  }

  /** Elimina (soft delete con historial) un split por su ID. */
  async deleteSplit(splitId: string): Promise<void> {
    await apiClient.delete(`${this.BASE}/${splitId}`);
  }

  /**
   * Países y plataformas disponibles (unión) en los releases de un conjunto de
   * canciones. Usado por los flujos masivos de álbum y label.
   */
  async getReleaseFiltersForSongs(
    songIds: string[]
  ): Promise<ReleaseFiltersOptions> {
    try {
      const response = await apiClient.post(`${this.BASE}/filter-options`, {
        songIds,
      });
      const data = (response.data?.data ?? { countries: [], platforms: [] }) as {
        countries: string[];
        platforms: string[];
      };
      return {
        countries: toSelectOptions(data.countries),
        platforms: toSelectOptions(data.platforms),
      };
    } catch {
      return { countries: [], platforms: [] };
    }
  }
}

export const songSplitsService = new SongSplitsService();
