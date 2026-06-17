import { apiClient } from "@/infrastructure/http/axiosClient";
import axios from "axios";
import type {
  RegisterSchema,
  RegisterSubuserSchema,
  UpdateUserSchema,
  UpdateProfileInfoSchema,
} from "../types";
import type {
  PasswordRecoveryResponse,
  CodeVerificationResponse,
  ResetPasswordResponse,
  ChangePasswordResponse,
  PlatformTourResponse,
  UnlinkSubuserResponse,
  SwitchAccountResponse,
} from "../types";

export type { UpdateUserSchema, UpdateProfileInfoSchema, RegisterSubuserSchema };
export type { SwitchAccountResponse, UnlinkSubuserResponse };

const BASE = "/users";

const getMessageFromPayload = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: unknown }).message === "string") {
    return (payload as { message: string }).message;
  }
  return fallback;
};

export const AuthService = {
  /** Autentica al usuario con email y contraseña */
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post(`${BASE}/sign-in`, { email, password });
      return response.data;
    } catch {
      return null;
    }
  },

  /** Registra un nuevo usuario */
  register: async (payload: RegisterSchema) => {
    try {
      const response = await apiClient.post(`${BASE}/sign-up`, payload);
      return response.data;
    } catch {
      return null;
    }
  },

  /** Registra un subperfil asociado a un usuario principal */
  registerSubuser: async (payload: RegisterSubuserSchema) => {
    try {
      const response = await apiClient.post(`${BASE}/sign-up-subuser`, payload);
      return response.data;
    } catch {
      return null;
    }
  },

  /** Obtiene los subperfiles del usuario autenticado */
  getSubUsersByUser: async () => {
    try {
      const response = await apiClient.get(`${BASE}/subusers`);
      return response.data;
    } catch {
      return null;
    }
  },

  /** Obtiene la lista de subperfiles */
  getlistOfSubusers: async () => {
    try {
      const response = await apiClient.get(`${BASE}/list-subusers`);
      return response.data;
    } catch {
      return null;
    }
  },

  /** Cambia la cuenta activa al usuario especificado */
  switchAccount: async (targetUserId: string): Promise<SwitchAccountResponse> => {
    if (!targetUserId.trim()) return { success: false, message: "ID de usuario inválido", status: 400 };
    try {
      const response = await apiClient.post(
        `${BASE}/switch-account`,
        { targetUserId },
        { validateStatus: (s) => (s >= 200 && s < 300) || [400, 401, 404, 409, 422].includes(s) }
      );
      if (response.status < 200 || response.status >= 300) {
        return { success: false, message: getMessageFromPayload(response.data, "No se pudo cambiar de cuenta"), status: response.status };
      }
      return { success: true, message: response.data?.message ?? "Account switched successfully", status: response.status, data: response.data?.data ?? response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { success: false, message: getMessageFromPayload(error.response?.data, "No se pudo cambiar de cuenta"), status: error.response?.status ?? 500 };
      }
      return { success: false, message: "No se pudo cambiar de cuenta", status: 500 };
    }
  },

  /** Cambia la cuenta activa a un subperfil */
  switchSubuser: async (subuserId: string): Promise<SwitchAccountResponse> => {
    return AuthService.switchAccount(subuserId);
  },

  /** Desvincula un subperfil del usuario actual */
  unlinkSubuser: async (subuserId: string): Promise<UnlinkSubuserResponse> => {
    if (!subuserId.trim()) return { success: false, message: "ID de subperfil inválido" };
    try {
      const response = await apiClient.delete(`${BASE}/subusers/${subuserId}`);
      return { success: true, message: response.data?.message ?? "Subperfil desvinculado correctamente" };
    } catch (error) {
      return { success: false, message: getMessageFromPayload(axios.isAxiosError(error) ? error.response?.data : undefined, "No se pudo desvincular el subperfil") };
    }
  },

  /** Actualiza los datos básicos del usuario */
  updateUser: async (payload: UpdateUserSchema) => {
    try {
      const { userId: _id, email: _email, ...body } = payload;
      const response = await apiClient.put(`${BASE}/update/${payload.userId}`, body);
      const currentUser = JSON.parse(localStorage.getItem("user") ?? "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...response.data.data }));
      return response.data;
    } catch {
      return null;
    }
  },

  /** Actualiza la información de perfil (país, profesión, dirección) */
  updateProfileInfo: async (payload: UpdateProfileInfoSchema) => {
    try {
      const response = await apiClient.put(`${BASE}/profile-info`, payload);
      const updatedPayload = response.data?.data?.user ?? response.data?.data ?? response.data?.user ?? {};
      const currentUser = JSON.parse(localStorage.getItem("user") ?? "{}");
      const updatedUser = {
        ...currentUser,
        ...updatedPayload,
        onboardingData: {
          ...(currentUser.onboardingData ?? {}),
          ...(updatedPayload.onboardingData ?? {}),
          country: payload.country ?? currentUser.onboardingData?.country ?? null,
          profession: payload.profession ?? currentUser.onboardingData?.profession ?? null,
          address: payload.address ?? currentUser.onboardingData?.address ?? null,
        },
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return response.data;
    } catch {
      return null;
    }
  },

  /** Envía el email de recuperación de contraseña */
  sentPasswordRecoveryRequest: async (email: string): Promise<PasswordRecoveryResponse> => {
    try {
      const response = await apiClient.post(
        `${BASE}/password-recovery/request`,
        { email },
        { validateStatus: (s) => (s >= 200 && s < 300) || [404, 409].includes(s) }
      );
      if (response.status === 404 || response.status === 409) {
        return { success: false, message: "correo no encontrado", status: response.status };
      }
      return { success: true, message: response.data?.message ?? "If the email exists, the recovery code was sent", status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error) && [404, 409].includes(error.response?.status ?? 0)) {
        return { success: false, message: "correo no encontrado", status: error.response!.status };
      }
      return { success: false, message: "No se pudo enviar el código", status: 500 };
    }
  },

  /** Verifica el código de recuperación de contraseña */
  sentcodeForPasswordRecovery: async (email: string, code: string): Promise<CodeVerificationResponse> => {
    try {
      const response = await apiClient.post(`${BASE}/password-recovery/verify-code`, { email, code });
      return { success: true, message: response.data?.message ?? "Código verificado correctamente", status: response.status, token: response.data?.token };
    } catch {
      return { success: false, message: "Código inválido o expirado", status: 400 };
    }
  },

  /** Restablece la contraseña con un código de recuperación */
  resetPasswordByCode: async (email: string, code: string, newPassword: string, newPasswordConfirmation: string): Promise<ResetPasswordResponse> => {
    try {
      const response = await apiClient.post(
        `${BASE}/password-recovery/reset`,
        { email, code, newPassword, newPasswordConfirmation },
        { validateStatus: (s) => (s >= 200 && s < 300) || [400, 401, 404, 409, 422].includes(s) }
      );
      if (response.status < 200 || response.status >= 300) {
        return { success: false, message: getMessageFromPayload(response.data, "Error al restablecer la contraseña"), status: response.status };
      }
      return { success: true, message: response.data?.message ?? "Contraseña restablecida correctamente", status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { success: false, message: getMessageFromPayload(error.response?.data, "Error al restablecer la contraseña"), status: error.response?.status ?? 500 };
      }
      return { success: false, message: "Error al restablecer la contraseña", status: 500 };
    }
  },

  /** Cambia la contraseña del usuario autenticado */
  changePassword: async (newPassword: string, newPasswordConfirmation: string, currentPassword?: string, token?: string): Promise<ChangePasswordResponse> => {
    try {
      const authToken = (token ?? localStorage.getItem("token") ?? "").trim().replace(/^Bearer\s+/i, "").trim();
      if (!authToken) return { success: false, message: "No se encontró token de autenticación", status: 401 };
      const payload = { newPassword, newPasswordConfirmation, token: authToken, ...(currentPassword ? { currentPassword } : {}) };
      const response = await apiClient.post(
        `${BASE}/password/change`,
        payload,
        { validateStatus: (s) => (s >= 200 && s < 300) || [400, 401, 404, 409, 422].includes(s) }
      );
      if (response.status < 200 || response.status >= 300) {
        return { success: false, message: getMessageFromPayload(response.data, "Error al cambiar la contraseña"), status: response.status };
      }
      return { success: true, message: response.data?.message ?? "Contraseña cambiada correctamente", status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { success: false, message: getMessageFromPayload(error.response?.data, "Error al cambiar la contraseña"), status: error.response?.status ?? 500 };
      }
      return { success: false, message: "Error al cambiar la contraseña", status: 500 };
    }
  },

  /** Marca el tour del dashboard como completado */
  completeDashboardTour: async (completed: boolean): Promise<PlatformTourResponse> => {
    try {
      const response = await apiClient.post(
        `${BASE}/dashboard-tour/complete`,
        { completed },
        { validateStatus: (s) => (s >= 200 && s < 300) || [400, 401, 404, 409, 422].includes(s) }
      );
      if (response.status < 200 || response.status >= 300) {
        return { success: false, message: getMessageFromPayload(response.data, "Error al actualizar el tour"), status: response.status };
      }
      return { success: true, message: response.data?.message ?? "Tour actualizado", status: response.status };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { success: false, message: getMessageFromPayload(error.response?.data, "Error al actualizar el tour"), status: error.response?.status ?? 500 };
      }
      return { success: false, message: "Error al actualizar el tour", status: 500 };
    }
  },

  /** Cierra la sesión del usuario y limpia el storage local */
  logout: async () => {
    try {
      await apiClient.post(`${BASE}/logout`, {});
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuth");
      localStorage.removeItem("dashboard-tour-completed");
      window.location.href = "/auth/email-login";
    }
  },
};
