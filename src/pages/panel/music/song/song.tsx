import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Music,
  Users,
  Calendar,
  BarChart3,
  Award,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import RoyaltiesService from "../../../../services/royalties";
import type { RoyaltyRequest } from "../../../../services/royalties";
import AddCollaborator from "../../collaborators/components/addCollaborator";
import Table from "./components/table";
import { useParams, useNavigate } from "react-router-dom";
import Platforms from "./components/platforms";
import Historyofsplits from "./components/historyofsplits";
import Extraordinarycosts from "./components/extraordinarycosts";
import useSong from "../../../../hooks/useSong";
import Loading from "../../../../components/loading/loading";
import StripeConnectLoginModal from "../../../../components/modal/StripeConnectLoginModal";
import StripePaymentModal from "../../../../components/modal/StripePaymentModal";
import LocalStorageService from "../../../../services/localstorage";
import PaymentHistory from "../../../../components/PaymentHistory/PaymentHistory";
import useCurrentCollaborator from "../../../../hooks/useCurrentCollaborator";
import { validatePayAllPayment } from "../../../../services/songs";
import { accountingApi } from "../../../../services/accounting";
import ValidationToastQueue, {
  ValidationToastItem,
  ValidationToastType,
} from "../../../../components/alert/ValidationToastQueue";
import Behavior from "../../dealers/components/behavior";
import DocumentManager from "./components/documentManager";

export default function Song() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    song,
    loading,
    getCollaboratorsInfo,
    getOwnerPercentage,
    getOwnerTotalOwed,
  } = useSong({ id: id || "" });
  const { getCurrentUserPercentage, getCurrentUserAmount } =
    useCurrentCollaborator({ collaborators: song?.collaborators || [] });
  const [showStripeLoginModal, setShowStripeLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toasts, setToasts] = useState<ValidationToastItem[]>([]);
  const [paymentHistoryRefresh, setPaymentHistoryRefresh] = useState(0);
  const [balance, setBalance] = useState<{
    totalIngresos: number;
    totalEgresos: number;
  } | null>(null);

  const [royaltyRequest, setRoyaltyRequest] = useState<RoyaltyRequest | null>(null);
  const [royaltyLoading, setRoyaltyLoading] = useState(false);
  const [royaltySubmitting, setRoyaltySubmitting] = useState(false);

  const addToast = (
    type: ValidationToastType,
    message: string,
    extra?: Partial<ValidationToastItem>,
  ) => {
    setToasts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        message,
        ...extra,
      },
    ]);
  };

  const dequeueToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (!id) return;
    const fetchBalance = async () => {
      try {
        const data = await accountingApi.getBalanceBySongId(id);
        setBalance({
          totalIngresos: data?.totalIngresos || 0,
          totalEgresos: data?.totalEgresos || 0,
        });
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [id]);

  // Load existing royalty request for this song (collaborator view)
  useEffect(() => {
    if (!id) return;
    setRoyaltyLoading(true);
    RoyaltiesService.getMyRequests().then((res) => {
      const list: RoyaltyRequest[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      const match = list.find(
        (r) =>
          (typeof r.songId === "object" ? r.songId._id : r.songId) === id,
      );
      setRoyaltyRequest(match ?? null);
      setRoyaltyLoading(false);
    });
  }, [id]);

  const handleRequestRoyalties = async () => {
    if (!id || royaltySubmitting) return;
    setRoyaltySubmitting(true);
    const res = await RoyaltiesService.requestRoyalties(id);
    if (res) {
      // Re-fetch to get the created request with full data
      const updated = await RoyaltiesService.getMyRequests();
      const list: RoyaltyRequest[] = Array.isArray(updated?.data)
        ? updated.data
        : Array.isArray(updated)
          ? updated
          : [];
      const match = list.find(
        (r) =>
          (typeof r.songId === "object" ? r.songId._id : r.songId) === id,
      );
      setRoyaltyRequest(match ?? null);
    }
    setRoyaltySubmitting(false);
  };

  const getUserDisplayPercentage = () => {
    const collaboratorPercentage = getCurrentUserPercentage();
    if (collaboratorPercentage && collaboratorPercentage > 0) {
      return collaboratorPercentage;
    }
    return getOwnerPercentage();
  };

  const getUserDisplayAmount = () => {
    const collaboratorAmount = getCurrentUserAmount();
    if (collaboratorAmount && parseFloat(collaboratorAmount) > 0) {
      return collaboratorAmount;
    }
    const ownerPct = getOwnerPercentage();
    const totalIncome = song?.totalNetIncome || 0;
    return ((ownerPct / 100) * totalIncome).toFixed(2);
  };

  const isStripeConnected = () => {
    const authData = LocalStorageService.getItem("stripe_connect_auth");
    return authData?.isLoggedIn === true;
  };

  const handlePayAllClick = () => {
    // totalEgresos = gastos extraordinarios
    // totalIngresos = ganancias de la canción
    const totalEgresos = balance?.totalEgresos || 0;
    const totalIngresos = song?.totalNetIncome || 0;

    const validation = validatePayAllPayment({
      song,
      isStripeConnected: isStripeConnected(),
      totalEgresos,
      totalIngresos,
    });
    const blockingIssues = validation.issues.filter(
      (issue) => issue.code !== "all-valid",
    );
    const currentUserDisplayName =
      currentUser?.name || currentUser?.username || currentUser?.email || "Tú";
    // Obtener todos los mensajes de error que no son de colaboradores específicos
    const payerReasons = blockingIssues
      .filter((issue) => !issue.collaboratorEmail)
      .map((issue) => issue.message);
    const getToastTypeFromReasons = (
      reasons: string[],
      fallback: ValidationToastType,
    ) => {
      if (reasons.length === 0) return fallback;
      return "error" as ValidationToastType;
    };
    const collaboratorToasts = validation.collaborators.map((collaborator) => ({
      id:
        Date.now() +
        Math.floor(Math.random() * 1000) +
        Math.floor(Math.random() * 1000),
      type: getToastTypeFromReasons(
        collaborator.reasons.map((issue) => issue.message),
        collaborator.canPay ? "success" : "error",
      ),
      message: collaborator.name,
      title: collaborator.name,
      email: collaborator.email,
      reasons: collaborator.reasons.map((issue) => issue.message),
      canPay: collaborator.canPay,
    }));
    // Mostrar siempre el toast del pagador con los motivos del pago
    const payerToast: ValidationToastItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: validation.canProceed ? "success" : "error",
      message: currentUserDisplayName,
      title: currentUserDisplayName,
      email: currentUser?.email || "",
      reasons:
        payerReasons.length > 0
          ? payerReasons
          : validation.canProceed
            ? []
            : ["No puedes continuar con el pago con la configuración actual."],
      canPay: validation.canProceed,
    };
    const validationToasts = [payerToast, ...collaboratorToasts];

    if (validationToasts.length > 0) {
      setToasts((prev) => [...prev, ...validationToasts]);
    }

    if (blockingIssues.length > 0 || !validation.canProceed) {
      return;
    }

    setShowPaymentModal(true);
  };

  const handleStripeLoginSuccess = () => {
    addToast(
      "success",
      "¡Inicio de sesión exitoso! Te has conectado correctamente con Stripe Connect.",
    );
  };

  const handlePaymentSuccess = () => {
    setPaymentHistoryRefresh((prev) => prev + 1);
    addToast(
      "success",
      "¡Pago procesado exitosamente! Los colaboradores recibirán su parte correspondiente.",
    );
  };

  const ownerAmount = getOwnerTotalOwed();
  // Usar collaboratorsEarnings del backend si está disponible, si no calcular
  const totalToPay = song?.collaboratorsEarnings ?? Math.max(0, (song?.totalNetIncome || 0) - ownerAmount);
  const currentUser = LocalStorageService.getItem("user");
  const normalizeIdentity = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const currentUserIds = [
    currentUser?.id,
    currentUser?._id,
    currentUser?.userId,
  ]
    .filter(Boolean)
    .map((value) => String(value));
  const currentUserEmail = normalizeIdentity(currentUser?.email);
  const currentUserUsername = normalizeIdentity(currentUser?.username);
  const ownerIds = [
    typeof song?.ownerId === "string" ? song?.ownerId : undefined,
    song?.ownerId?._id,
    song?.ownerId?.id,
    song?.owner?._id,
    song?.owner?.id,
  ]
    .filter(Boolean)
    .map((value) => String(value));
  const ownerEmails = [song?.ownerId?.email, song?.owner?.email]
    .filter(Boolean)
    .map((value) => normalizeIdentity(value));
  const ownerUsernames = [song?.ownerId?.username, song?.owner?.username]
    .filter(Boolean)
    .map((value) => normalizeIdentity(value));
  const hasOwnerIdentity = ownerEmails.length > 0 || ownerUsernames.length > 0;
  const emailMatchesOwner =
    currentUserEmail !== "" && ownerEmails.includes(currentUserEmail);
  const usernameMatchesOwner =
    currentUserUsername !== "" && ownerUsernames.includes(currentUserUsername);
  const idMatchesOwner =
    ownerIds.length > 0 &&
    currentUserIds.some((currentId) => ownerIds.includes(currentId));
  const isSubuserSession = Boolean(currentUser?.parentUserId);
  const isOwnerUser =
    emailMatchesOwner ||
    usernameMatchesOwner ||
    (!isSubuserSession && !hasOwnerIdentity && idMatchesOwner);

  if (loading) return <Loading />;

  return (
    <React.Fragment>
      <StripeConnectLoginModal
        isOpen={showStripeLoginModal}
        onClose={() => setShowStripeLoginModal(false)}
        onLoginSuccess={handleStripeLoginSuccess}
      />
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        songTitle={song?.trackTitle}
        songId={song?._id || song?.id}
        totalAmount={song?.totalNetIncome || 0}
        collaborators={song?.collaborators || []}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <ValidationToastQueue toasts={toasts} onDequeue={dequeueToast} />
      <div className="min-h-screen bg-[#F7F8FA] px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalle de Canción
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Información de la pista y regalías
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 hover:text-gray-600 cursor-pointer">
              Inicio
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400 hover:text-gray-600 cursor-pointer">
              Música
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">
              Detalle de Canción
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {/* Hero Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-6 col-span-3">
            {/* Album Art */}
            <div className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
              {song?.spotifyData?.album?.images?.length > 0 ? (
                <img
                  src={song.spotifyData.album.images[0].url}
                  alt={`${song.trackTitle} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-12 h-12 text-gray-300" />
              )}
            </div>

            {/* Song Info */}
            <div className="flex-1 flex flex-col gap-5">
              {/* Title row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {song?.trackTitle || "—"}
                  </h2>
                  <p className="flex items-center gap-2 text-gray-500 text-sm">
                    <Users className="w-4 h-4" />
                    {song?.artistName || "—"}
                  </p>
                </div>
                <span className="flex-shrink-0 bg-[#F97316] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  ISRC: {song?.isrc || "—"}
                </span>
              </div>

              {/* Stat Cards */}
              <div className={`grid gap-2 ${isOwnerUser ? "grid-cols-3" : "grid-cols-2"}`}>
                {/* Streams */}
                <div className="bg-blue-50 rounded-xl p-4 space-y-2 ">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Total Streams
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {song?.totalStreams?.toLocaleString() || "0"}
                  </p>
                </div>

                {/* Net Income */}
                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Net Income
                    </span>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    $
                    {song?.totalNetIncome?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </p>
                </div>

                {/* My Percentage — owner only */}
                {isOwnerUser && (
                  <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        Mi porcentaje
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xl font-bold text-purple-600">
                        ${getUserDisplayAmount()}
                      </p>
                      <span className="text-xs text-gray-400">
                        {getUserDisplayPercentage()}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Banner — owner */}
          {isOwnerUser && (
            <div className="bg-[#F97316] rounded-xl p-6 col-span-1 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                    Próxima liquidación
                  </span>
                </div>
                <p className="text-white text-base font-semibold pl-10">
                  10 Julio 2024
                </p>
              </div>

              <div className="relative z-10 my-5 border-t border-white/20" />

              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Total a pagar
                  </p>
                  <p className="text-white text-3xl font-bold tracking-tight">
                    ${totalToPay.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handlePayAllClick}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#F97316] font-bold text-sm px-4 py-3 rounded-xl hover:bg-orange-50 active:scale-[0.98] transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  Pagar a todos
                </button>
              </div>
            </div>
          )}

          {/* Royalties Banner — collaborator */}
          {!isOwnerUser && (
            <div className="bg-[#0F172A] rounded-xl p-6 col-span-1 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

              {/* Split info */}
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#F97316]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-[#F97316]" />
                  </div>
                  <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                    Mi participación
                  </span>
                </div>

                <div className="flex items-end gap-3 pl-10">
                  <div className="flex flex-col">
                    <span className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">
                      Split
                    </span>
                    <span className="text-[#F97316] text-3xl font-bold tracking-tight">
                      {getUserDisplayPercentage()}%
                    </span>
                  </div>
                  <div className="flex flex-col mb-1">
                    <span className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">
                      Estimado
                    </span>
                    <span className="text-white text-lg font-bold">
                      ${getUserDisplayAmount()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 my-4 border-t border-white/10" />

              {/* Request status / button */}
              <div className="relative z-10 space-y-3">
                {royaltyLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : royaltyRequest ? (
                  <>
                    {royaltyRequest.status === "pending" && (
                      <div className="flex items-center gap-2.5 px-3 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <Clock className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[#F97316] text-xs font-bold">
                            Solicitud pendiente
                          </span>
                          <span className="text-white/50 text-[10px]">
                            Esperando respuesta del owner
                          </span>
                        </div>
                      </div>
                    )}
                    {royaltyRequest.status === "accepted" && (
                      <div className="flex items-center gap-2.5 px-3 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-[#34D399] flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[#34D399] text-xs font-bold">
                            Solicitud aceptada
                          </span>
                          <span className="text-white/50 text-[10px]">
                            El owner aprobó tu solicitud
                          </span>
                        </div>
                      </div>
                    )}
                    {royaltyRequest.status === "rejected" && (
                      <div className="flex items-center gap-2.5 px-3 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <XCircle className="w-4 h-4 text-[#F43F5E] flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[#F43F5E] text-xs font-bold">
                            Solicitud rechazada
                          </span>
                          <span className="text-white/50 text-[10px]">
                            Puedes volver a solicitar
                          </span>
                        </div>
                      </div>
                    )}
                    {royaltyRequest.status === "rejected" && (
                      <button
                        onClick={handleRequestRoyalties}
                        disabled={royaltySubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-3 rounded-xl active:scale-[0.98] transition-all"
                      >
                        {royaltySubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Solicitar de nuevo
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRequestRoyalties}
                      disabled={royaltySubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-3 rounded-xl active:scale-[0.98] transition-all"
                    >
                      {royaltySubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Solicitar regalías
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Collaborators Card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-gray-900" />
              <h3 className="text-base font-bold text-gray-900">
                Colaboradores
              </h3>
            </div>
            <AddCollaborator compact isOwner={isOwnerUser} />
          </div>
          <Table
            collaborators={getCollaboratorsInfo()}
            songId={song?._id || song?.id}
            song={song}
            isOwner={isOwnerUser}
          />
        </div>
        {/* Behavior / Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Behavior songId={id} compact />
          {/*Platforms */}
          <Platforms reproductions={song?.reproductions} />
        </div>
        {/* Payment History + Platforms */}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <PaymentHistory
            title="Historial de Pagos Realizados"
            maxHeight="400px"
            refreshTrigger={paymentHistoryRefresh}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* History of Splits */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden col-span-1 lg:col-span-2">
            <Historyofsplits songId={id} />
          </div>
          {/* Extraordinary Costs */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden col-span-1 lg:col-span-2">
            <Extraordinarycosts songId={id || ""} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Specific Data */}
          {/* <div className="bg-white border border-gray-200 rounded-xl overflow-hidden col-span-1 lg:col-span-2">
            <EspecificData song={song} />
          </div> */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden col-span-1 lg:col-span-4">
            <DocumentManager songId={id || ""} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
