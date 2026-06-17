import "./home.css";
import { useState } from "react";
import PlatformsCard from "@/components/platformsCard/platformsCard";
import CreateWalletModal from "@/components/wallet/CreateWalletModal";
import WithdrawalModal from "@/components/wallet/WithdrawalModal";
import TransferFundsModal from "@/components/wallet/TransferFundsModal";
import { DashboardStatsCards } from "@/components/home/DashboardStatsCards";
import { PerformanceChart } from "@/components/home/PerformanceChart";
import { WalletSection } from "@/components/home/WalletSection";
import { TopSongsTable } from "@/components/home/TopSongsTable";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import WalletService from "@/services/wallet";

export default function Home() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const {
    user,
    selectedTimeframe,
    setSelectedTimeframe,
    topSongs,
    summary,
    totalAmount,
    netBalance,
    walletBalance,
    walletLoading,
    hasWallet,
    createWallet,
    refreshWallet,
    series,
    chartOptions,
  } = useHomeDashboard();

  return (
    <>


      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="px-6 lg:px-10 py-8 flex flex-col gap-7">
          <div data-tour="hero-header" className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#111827]">
                Bienvenido de vuelta, {user?.name}
              </h1>
              <p className="text-sm text-[#6B7280]">
                Aquí lo que ha pasado con tu música los últimos días
              </p>
            </div>
            <div className="w-10 h-0.5 rounded-full bg-[#F97316]" />
          </div>

          <div className="grid grid-cols-12 gap-4" data-tour="stats-cards">
            <DashboardStatsCards
              totalStreams={summary.totalStreams}
              totalNetIncome={summary.totalNetIncome}
              songsCount={summary.songsWithMatches}
              netBalance={netBalance}
              totalAmount={totalAmount}
            />

            <WalletSection
              walletLoading={walletLoading}
              hasWallet={hasWallet}
              balance={walletBalance}
              onCreateWallet={() => setIsWalletModalOpen(true)}
              onTransfer={() => setIsTransferModalOpen(true)}
              onWithdrawal={() => setIsWithdrawalModalOpen(true)}
            />

            <PerformanceChart
              series={series}
              options={chartOptions}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />



            <PlatformsCard />

            <div
              className="flex-1 bg-white rounded-xl p-6 border border-gray-200 col-span-9"
              data-tour="top-songs"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Canciones Principales</h2>
                  <a
                    href="/panel/music"
                    className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Ver todas
                  </a>
                </div>
                <TopSongsTable songs={topSongs} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSubmit={async (data) => {
          const result = await createWallet(data);
          if (result.success) {
            setIsWalletModalOpen(false);
            refreshWallet();
          }
          return result;
        }}
      />

      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        walletBalance={walletBalance}
        onWithdrawalSuccess={refreshWallet}
      />

      <TransferFundsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        walletBalance={walletBalance}
        onTransferConfirm={async (amount, recipientEmail, note) => {
          const result = await WalletService.sendFundsToUser({ amount, recipientEmail, note });
          if (!result.error) refreshWallet();
          return result;
        }}
      />
    </>
  );
}
