import { apiClient } from "@/infrastructure/http/axiosClient";
import type { ApiCollaboratorDetail } from "@/types/collaborator.types";

export interface CollaboratorListResponse {
  collaborators: ApiCollaboratorDetail[];
  total: number;
}

class CollaboratorService {
  private readonly BASE = "/collaborators";

  /** Obtiene todos los colaboradores del owner autenticado con participación y canciones */
  async getAll(): Promise<CollaboratorListResponse | null> {
    try {
      const response = await apiClient.get(this.BASE);
      return response.data?.data ?? response.data ?? null;
    } catch {
      return null;
    }
  }

  /** Obtiene resumen general + detalle de cada colaborador del owner autenticado */
  async getMetrics() {
    try {
      const response = await apiClient.get(`${this.BASE}/metrics`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene métricas de plataformas por canción de un colaborador */
  async getSongMetrics(collaboratorId: string) {
    try {
      const response = await apiClient.get(`${this.BASE}/${collaboratorId}/metrics`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene un colaborador específico por ID */
  async getById(collaboratorId: string) {
    try {
      const response = await apiClient.get(`${this.BASE}/${collaboratorId}`);
      return response.data;
    } catch {
      return null;
    }
  }
}

export default new CollaboratorService();
