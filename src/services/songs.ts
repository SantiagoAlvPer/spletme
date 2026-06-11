import { apiClient } from "@/infrastructure/http/axiosClient";
import type { SongBalance } from "./accounting";
import type { ReleaseFiltersOptions, SelectOption } from "@/types";

/** Convierte una lista de strings crudos de la BD en opciones para react-select */
const toSelectOptions = (values: string[]): SelectOption[] =>
  (values ?? []).map((value) => ({ value, label: value }));

export type PaymentValidationSeverity = "success" | "info" | "warning" | "error";

export interface PaymentValidationIssue {
  code: string;
  severity: PaymentValidationSeverity;
  message: string;
  collaboratorName?: string;
  collaboratorEmail?: string;
}

export interface PaymentValidationCollaboratorResult {
  id: string;
  name: string;
  email: string;
  canPay: boolean;
  reasons: PaymentValidationIssue[];
}

export interface PaymentValidationResult {
  canProceed: boolean;
  totalCollaborators: number;
  payableCollaborators: number;
  issues: PaymentValidationIssue[];
  collaborators: PaymentValidationCollaboratorResult[];
}

// ── Helpers de validación de pagos (sin dependencias de red) ──────────────────

const getPercentageFromSplitConditions = (collaborator: Record<string, unknown>): number => {
  const conditions = collaborator?.split as { conditions?: unknown[] } | undefined;
  if (!Array.isArray(conditions?.conditions) || conditions.conditions.length === 0) return 0;
  const cond = conditions.conditions.find((c: unknown) => {
    const co = c as Record<string, unknown>;
    return co?.type === "percentage" || co?.percentage !== undefined || co?.value !== undefined;
  }) as Record<string, unknown> | undefined;
  return Number(cond?.percentage ?? cond?.value ?? 0);
};

const getCollaboratorPercentage = (collaborator: Record<string, unknown>): number => {
  const direct = Number(collaborator?.percentage ?? 0);
  return direct > 0 ? direct : getPercentageFromSplitConditions(collaborator);
};

const getCollaboratorAmountToPay = (collaborator: Record<string, unknown>): number => {
  const direct = Number(collaborator?.amountToPay ?? 0);
  if (direct > 0) return direct;
  const splits = collaborator?.splitPayment as Array<{ calculation?: { amountToPay?: number } }> | undefined;
  return Number(splits?.[0]?.calculation?.amountToPay ?? 0);
};

const hasActiveWallet = (collaborator: Record<string, unknown>): boolean => {
  const wallet = collaborator?.wallet as Record<string, unknown> | undefined;
  const status = String(wallet?.status ?? collaborator?.walletStatus ?? "").toLowerCase();
  return Boolean(
    collaborator?.hasWallet === true ||
    collaborator?.walletActive === true ||
    wallet?.isActive === true ||
    collaborator?.stripeConnected === true ||
    collaborator?.stripeAccountConnected === true ||
    (collaborator?.stripeConnect as Record<string, unknown>)?.isLoggedIn === true ||
    status === "active" || status === "enabled" || status === "verified"
  );
};

const getDisplayName = (collaborator: Record<string, unknown>, idx: number): string =>
  String(collaborator?.name ?? collaborator?.username ?? collaborator?.email ??
    collaborator?.id ?? collaborator?._id ?? `Colaborador ${idx + 1}`);

export const validatePayAllPayment = ({
  song,
  isStripeConnected,
  totalEgresos = 0,
  totalIngresos = 0,
}: {
  song: Record<string, unknown> | null;
  isStripeConnected: boolean;
  totalEgresos?: number;
  totalIngresos?: number;
}): PaymentValidationResult => {
  const issues: PaymentValidationIssue[] = [];
  const collaboratorsResult: PaymentValidationCollaboratorResult[] = [];
  const collaborators = Array.isArray(song?.collaborators) ? (song.collaborators as Record<string, unknown>[]) : [];
  const totalCollaborators = collaborators.length;

  if (!song) {
    issues.push({ code: "song-not-found", severity: "error", message: "No se pudo cargar la canción. Recarga la página e inténtalo de nuevo." });
    return { canProceed: false, totalCollaborators: 0, payableCollaborators: 0, issues, collaborators: [] };
  }

  if (totalEgresos > 0 && totalIngresos > 0 && totalEgresos > totalIngresos) {
    issues.push({ code: "costs-exceed-income", severity: "error", message: `Los costos extraordinarios ($${totalEgresos.toFixed(2)}) superan las ganancias ($${totalIngresos.toFixed(2)}). No puedes proceder con el pago.` });
  }

  if (!isStripeConnected) {
    issues.push({ code: "wallet-not-connected", severity: "error", message: "No puedes pagar a todos porque tu wallet no está conectada o no está activa." });
  }

  let payableCollaborators = 0;

  collaborators.forEach((collaborator, idx) => {
    const name = getDisplayName(collaborator, idx);
    const email = String(collaborator?.email ?? "");
    const collaboratorIssues: PaymentValidationIssue[] = [];
    const percentage = getCollaboratorPercentage(collaborator);
    const amountToPay = getCollaboratorAmountToPay(collaborator);
    const walletActive = hasActiveWallet(collaborator);

    if (percentage <= 0) {
      const issue = {
        code: "no-split-percentage",
        severity: "warning" as const,
        message: `${name} no tiene un porcentaje de split asignado.`,
        collaboratorName: name,
        collaboratorEmail: email,
      };
      issues.push(issue);
      collaboratorIssues.push(issue);
    }
    if (amountToPay <= 0) {
      const issue = {
        code: "no-amount-to-pay",
        severity: "info" as const,
        message: `${name} no tiene monto pendiente de pago.`,
        collaboratorName: name,
        collaboratorEmail: email,
      };
      issues.push(issue);
      collaboratorIssues.push(issue);
    }
    if (!walletActive) {
      const issue = {
        code: "wallet-inactive",
        severity: "warning" as const,
        message: `${name} no tiene una wallet activa para recibir pagos.`,
        collaboratorName: name,
        collaboratorEmail: email,
      };
      issues.push(issue);
      collaboratorIssues.push(issue);
    }

    if (percentage > 0 && amountToPay > 0 && walletActive) {
      payableCollaborators++;
      const issue = {
        code: "all-valid",
        severity: "success" as const,
        message: `${name} puede recibir el pago de $${amountToPay.toFixed(2)}.`,
        collaboratorName: name,
        collaboratorEmail: email,
      };
      issues.push(issue);
      collaboratorIssues.push(issue);
    }

    collaboratorsResult.push({
      id: String(collaborator?.id ?? collaborator?._id ?? email ?? name ?? idx),
      name,
      email,
      canPay: percentage > 0 && amountToPay > 0 && walletActive,
      reasons: collaboratorIssues.filter((issue) => issue.code !== "all-valid"),
    });
  });

  const hasBlockingIssues = issues.some((i) => i.code !== "all-valid");
   return { canProceed: !hasBlockingIssues && isStripeConnected && payableCollaborators > 0, totalCollaborators, payableCollaborators, issues, collaborators: collaboratorsResult };
};

// ── SongService ───────────────────────────────────────────────────────────────

class SongService {
  private readonly BASE = "/songs";

  /** Obtiene canciones del usuario con paginación */
  async getSongs(page: number, limit: number) {
    try {
      const response = await apiClient.get(`${this.BASE}/by-user?page=${page}&limit=${limit}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Sube canciones desde un archivo CSV */
  async uploadSongs(file: FormData) {
    try {
      const response = await apiClient.post(`${this.BASE}/by-csv`, file);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Acepta una invitación de colaboración */
  async acceptCollaboration(token: string) {
    try {
      const response = await apiClient.post(`${this.BASE}/accept-invitation`, { token });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Agrega un colaborador a una canción */
  async addCollaborator({ songId, collaboratorEmail, collaboratorId }: {
    songId: string;
    collaboratorEmail?: string;
    collaboratorId?: string;
  }) {
    try {
      const response = await apiClient.post(`${this.BASE}/${songId}/add-collaborator`, {
        collaboratorEmail,
        collaboratorId,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene una canción por ID */
  async getSong(id: string) {
    try {
      const response = await apiClient.get(`${this.BASE}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene una canción por su ISRC */
  async getSongByIsrc(isrc: string) {
    try {
      const response = await apiClient.get(`${this.BASE}/by-isrc/${encodeURIComponent(isrc)}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene canciones filtradas por país, plataforma y fechas */
  async getSongsByFilter(country: string, platform: string, startDate: string, endDate: string) {
    try {
      const response = await apiClient.get(`${this.BASE}/by-params`, {
        params: { country, platform, startDate, endDate },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene métricas de pagos de una canción por período */
  async getMetricPayments(songId: string, date: "month" | "day" | "year") {
    try {
      const response = await apiClient.get(`${this.BASE}/get-metric-payments/${songId}/${date}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Busca canciones por texto */
  async searchSongs(query: string, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`${this.BASE}/search`, {
        params: { q: query, page, limit },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Busca canciones por código ISRC o UPC */
  async searchSongsByCode(code: string, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`${this.BASE}/search-code`, {
        params: { code, page, limit },
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene las canciones con más streams */
  async getTopByStreams() {
    try {
      const response = await apiClient.get(`${this.BASE}/top-by-streams`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Obtiene estadísticas por plataforma de todas las canciones */
  async getStadisticsByPlatformAll() {
    try {
      const response = await apiClient.get(`${this.BASE}/getStadisticsByPlatformAll`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getBalanceBySongId(songId: string): Promise<SongBalance | null> {
    try {
      const response = await apiClient.get(`/accounting/balance/song/${songId}`);
      return response.data?.data ?? response.data;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene los países y plataformas presentes en los releases de una canción.
   * Devuelve cada valor como opción `{ value, label }` lista para react-select,
   * usando el string real de la BD como value para que el filtrado de splits
   * por país/plataforma coincida exactamente.
   */
  async getReleaseFilters(songId: string): Promise<ReleaseFiltersOptions> {
    try {
      const response = await apiClient.get(`${this.BASE}/${songId}/release-filters`);
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

export default new SongService();
