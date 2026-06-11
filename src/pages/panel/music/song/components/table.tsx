import { useState } from "react";
import SplitsModal from "../../../../../components/modal/SplitsModal";
import PaymentHistoryModal from "../../../../../components/modal/PaymentHistoryModal";
import OwnerSplitModal from "./ownerfrom";
import RegisterPaymentModal from "../../../../../components/modal/RegisterPaymentModal";
import PaymentConfirmationModal from "../../../../../components/modal/PaymentConfirmationModal";
import {
  DollarSign,
  Plus,
  History,
  Wallet,
  Users,
  Music,
} from "lucide-react";
import { User as UserType } from "../../../../../models/user";
import WalletService from "@/services/wallet";
import { useWallet } from "@/hooks/useWallet";
import { Link } from "react-router-dom";
import LocalStorageService from "@/services/localstorage";
import ValidationToastQueue, {
  ValidationToastItem,
  ValidationToastType,
} from "../../../../../components/alert/ValidationToastQueue";

interface Song {
  id?: string;
  _id?: string;
  trackTitle: string;
  artistName?: string;
  isrc?: string;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  collaborators?: Array<{
    id: string;
    _id?: string;
    name: string;
    email: string;
    hasActiveSplit?: boolean;
  }>;
  totalNetIncome?: number;
  releases?: Array<{
    id: string;
    platform: string;
    country: string;
    reportMonth: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  requesterRole?: "admin" | "collaborator" | "label";
  ownerEarnings?: number;
  collaboratorsEarnings?: number;
}

interface TableProps {
  collaborators: UserType[];
  songId?: string;
  song?: Song;
  isOwner?: boolean;
}

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-rose-500",
  "bg-teal-500",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Table({ collaborators, songId, song, isOwner = false }: TableProps) {
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] =
    useState(false);
  const [isRegisterPaymentModalOpen, setIsRegisterPaymentModalOpen] =
    useState(false);
  const [currentSplitId, setCurrentSplitId] = useState<string>("");
  const [isOwnerSplitModalOpen, setIsOwnerSplitModalOpen] = useState(false);
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] =
    useState(false);
  const [paymentData, setPaymentData] = useState<{
    collaboratorId: string;
    collaboratorName: string;
    collaboratorEmail: string;
    amount: number;
    songId: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ValidationToastItem[]>([]);

  const { wallet, hasWallet } = useWallet();
  const currentUser = LocalStorageService.getItem("user");
  const rawUserType = String(
    currentUser?.role ||
      currentUser?.type ||
      currentUser?.userType ||
      currentUser?.accountType ||
      ""
  ).toLowerCase();
  const isLabelUser = rawUserType.includes("label");
  const hasOwnerSplit = Boolean(
    (song as any)?.ownerId?.split ||
      (song as any)?.owner?.split ||
      (song as any)?.ownerSplit
  );

  const addToast = (type: ValidationToastType, message: string) => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), type, message },
    ]);
  };

  const dequeueToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleOpenSplitsModal = () => {
    if (isLabelUser && !hasOwnerSplit) {
      addToast(
        "error",
        "Error al crear split: el owner de la cancion a un no crea su split"
      );
      return;
    }
    setIsSplitsModalOpen(true);
  };

  const openPaymentHistoryModal = (splitId: string) => {
    setCurrentSplitId(splitId);
    setIsPaymentHistoryModalOpen(true);
  };

  const openRegisterPaymentModal = (splitId: string) => {
    setCurrentSplitId(splitId);
    setIsRegisterPaymentModalOpen(true);
  };

  const handleSplitSaved = (splitId: string) => {
    setCurrentSplitId(splitId);
    setTimeout(() => window.location.reload(), 500);
  };

  const handleOwnerSplitCreated = () => {
    setIsOwnerSplitModalOpen(false);
    window.location.reload();
  };

  const handlePaymentRegistered = () => {};

  const openPaymentConfirmation = (
    collaboratorId: string,
    collaboratorName: string,
    collaboratorEmail: string,
    amount: number,
    songId: string
  ) => {
    setPaymentData({
      collaboratorId,
      collaboratorName,
      collaboratorEmail,
      amount,
      songId,
    });
    setIsPaymentConfirmationOpen(true);
  };

  const paymentToCollaborator = async () => {
    if (!paymentData) return;
    const response = await WalletService.payCollaborator({
      collaboratorId: paymentData.collaboratorId,
      songId: paymentData.songId,
      amount: paymentData.amount,
    });
    if (response.error) {
      throw new Error(response.message || "Error al procesar el pago");
    }
  };

  return (
    <>
      <ValidationToastQueue toasts={toasts} onDequeue={dequeueToast} />
      {/* Modals */}
      <SplitsModal
        collaborators={collaborators}
        isOpen={isSplitsModalOpen}
        onClose={() => setIsSplitsModalOpen(false)}
        songId={songId || ""}
        onSplitSaved={handleSplitSaved}
      />
      <PaymentHistoryModal
        isOpen={isPaymentHistoryModalOpen}
        onClose={() => {
          setIsPaymentHistoryModalOpen(false);
          setCurrentSplitId("");
        }}
        splitId={currentSplitId}
        songTitle="Canción"
      />
      <RegisterPaymentModal
        isOpen={isRegisterPaymentModalOpen}
        onClose={() => {
          setIsRegisterPaymentModalOpen(false);
          setCurrentSplitId("");
        }}
        splitId={currentSplitId}
        songTitle="Canción"
        onPaymentRegistered={handlePaymentRegistered}
      />
      <OwnerSplitModal
        isOpen={isOwnerSplitModalOpen}
        onClose={() => setIsOwnerSplitModalOpen(false)}
        songId={songId || ""}
        song={song || { id: songId || "", trackTitle: "" }}
        onSplitCreated={handleOwnerSplitCreated}
      />
      <PaymentConfirmationModal
        isOpen={isPaymentConfirmationOpen}
        onClose={() => {
          setIsPaymentConfirmationOpen(false);
          setPaymentData(null);
        }}
        onConfirm={paymentToCollaborator}
        collaboratorName={paymentData?.collaboratorName || ""}
        collaboratorEmail={paymentData?.collaboratorEmail || ""}
        amount={paymentData?.amount || 0}
        walletBalance={wallet?.data?.accounts?.[0]?.balance || 0}
        currency="USD"
      />


      {/* Actions bar */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        {isOwner && song?.requesterRole === "admin" && (
          <button
            onClick={() => setIsOwnerSplitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Owner Split
          </button>
        )}
        {song?.requesterRole === "admin" && (
          <button
            onClick={handleOpenSplitsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Music className="w-3.5 h-3.5" />
            Configurar Splits
          </button>
        )}
        {currentSplitId && (
          <>
            <button
              onClick={() => openPaymentHistoryModal(currentSplitId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              Historial
            </button>
            {hasWallet ? (
              <button
                onClick={() => openRegisterPaymentModal(currentSplitId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Pago
              </button>
            ) : (
              <Link to="/panel/home">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  <Wallet className="w-3.5 h-3.5" />
                  Vincular Wallet
                </button>
              </Link>
            )}
          </>
        )}
      </div>

      {/* Table */}
      {collaborators && collaborators.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Split %
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Monto
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {collaborators.map((collaborator, idx) => {
              const hasActiveSplit =
                collaborator.percentage &&
                parseFloat(String(collaborator.percentage)) > 0;
              const avatarColor =
                AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <tr
                  key={collaborator.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white text-xs font-semibold">
                          {getInitials(collaborator.name || "?")}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {collaborator.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {collaborator.email}
                    </span>
                  </td>

                  {/* Split % */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {collaborator.percentage
                        ? `${collaborator.percentage}%`
                        : "—"}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {collaborator.amountToPay
                        ? `$${collaborator.amountToPay}`
                        : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    {hasActiveSplit ? (
                      <span className="inline-flex px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">
                        Sin split
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          openPaymentHistoryModal(currentSplitId)
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
                        Historial
                      </button>

                      {hasWallet ? (
                        <button
                          onClick={() =>
                            openPaymentConfirmation(
                              collaborator.id,
                              collaborator.name,
                              collaborator.email,
                              Number(collaborator.amountToPay) || 0,
                              songId || ""
                            )
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Pagar
                        </button>
                      ) : (
                        <Link to="/panel/home">
                          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors">
                            <Wallet className="w-3.5 h-3.5" />
                            Wallet
                          </button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Sin colaboradores
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs">
            Agrega colaboradores para gestionar splits y pagos de esta canción.
          </p>
          {isOwner && song?.requesterRole === "admin" && (
            <button
              onClick={handleOpenSplitsModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Configurar Splits
            </button>
          )}
        </div>
      )}
    </>
  );
}

export type { Song };
