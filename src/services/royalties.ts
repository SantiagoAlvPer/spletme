import { apiClient } from "@/infrastructure/http/axiosClient";

export type RoyaltyStatus = "pending" | "accepted" | "rejected";

export interface RoyaltyRequest {
  _id: string;
  songId: {
    _id: string;
    trackTitle: string;
    artistName: string;
    isrc: string;
  };
  requesterId?: {
    _id: string;
    name: string;
    email: string;
  };
  status: RoyaltyStatus;
  createdAt: string;
  updatedAt: string;
}

class RoyaltiesService {
  private readonly BASE = "/royalties";

  /** Collaborator requests royalties for a song */
  async requestRoyalties(songId: string) {
    try {
      const response = await apiClient.post(`${this.BASE}/request`, {
        songId,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /** Collaborator sees their own requests */
  async getMyRequests() {
    try {
      const response = await apiClient.get(`${this.BASE}/my-requests`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Owner sees requests made against their songs */
  async getIncomingRequests() {
    try {
      const response = await apiClient.get(`${this.BASE}/incoming`);
      return response.data;
    } catch {
      return null;
    }
  }
}

export default new RoyaltiesService();
