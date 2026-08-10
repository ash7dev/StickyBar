'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminFinanceHeaderBar, FinanceTab } from '@/features/admin/components/finances/AdminFinanceHeaderBar';
import { AdminPendingWithdrawalsTable, RetraitPendingItem } from '@/features/admin/components/finances/AdminPendingWithdrawalsTable';
import { AdminWithdrawalsHistoryTable, RetraitHistoryItem } from '@/features/admin/components/finances/AdminWithdrawalsHistoryTable';
import { AdminWalletTransactionsTable, WalletTransactionItem } from '@/features/admin/components/finances/AdminWalletTransactionsTable';
import { AdminWebhookLogsTable, WebhookLogItem } from '@/features/admin/components/finances/AdminWebhookLogsTable';
import { AdminRefundsTable, RefundItem } from '@/features/admin/components/finances/AdminRefundsTable';
import { AdminWalletAdjustmentModal } from '@/features/admin/components/finances/AdminWalletAdjustmentModal';
import { AdminWithdrawalActionModal } from '@/features/admin/components/finances/AdminWithdrawalActionModal';
import { adminApi } from '@/lib/nestjs';

export default function AdminFinancesPage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('WITHDRAWALS_PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Lists
  const [pendingWithdrawals, setPendingWithdrawals] = useState<RetraitPendingItem[]>([]);
  const [withdrawalsHistory, setWithdrawalsHistory] = useState<RetraitHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);

  // Modals & Toast
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<RetraitPendingItem | null>(null);
  const [isRejectionAction, setIsRejectionAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chargement dynamique des données selon l'onglet actif
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'WITHDRAWALS_PENDING') {
        const list = await adminApi.listWithdrawals();
        setPendingWithdrawals(list ?? []);
      } else if (activeTab === 'WITHDRAWALS_HISTORY') {
        const history = await adminApi.listWithdrawalsHistory();
        setWithdrawalsHistory(history ?? []);
      } else if (activeTab === 'TRANSACTIONS') {
        const result = await adminApi.listTransactions({ search: searchQuery });
        setTransactions(result?.data ?? []);
      } else if (activeTab === 'WEBHOOKS') {
        const result = await adminApi.listWebhookLogs();
        setWebhookLogs(result?.data ?? []);
      } else if (activeTab === 'REFUNDS') {
        const result = await adminApi.listRefunds();
        setRefunds(result?.data ?? []);
      }
    } catch {
      showToast("Erreur lors du chargement des données financières");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toujours charger le compteur de retraits en attente pour le badge header
  const [pendingCount, setPendingCount] = useState(0);
  const loadPendingCount = useCallback(async () => {
    try {
      const list = await adminApi.listWithdrawals();
      setPendingCount(list?.length ?? 0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  // Filtrage local recherche
  const filteredPendingWithdrawals = useMemo(() => {
    if (!searchQuery.trim()) return pendingWithdrawals;
    const q = searchQuery.toLowerCase();
    return pendingWithdrawals.filter((item) => {
      const name = `${item.wallet?.utilisateur?.prenom ?? ''} ${item.wallet?.utilisateur?.nom ?? ''}`.toLowerCase();
      const dest = (item.destinataire ?? '').toLowerCase();
      const method = (item.methode ?? '').toLowerCase();
      return name.includes(q) || dest.includes(q) || method.includes(q);
    });
  }, [pendingWithdrawals, searchQuery]);

  const filteredWithdrawalsHistory = useMemo(() => {
    if (!searchQuery.trim()) return withdrawalsHistory;
    const q = searchQuery.toLowerCase();
    return withdrawalsHistory.filter((item) => {
      const name = `${item.wallet?.utilisateur?.prenom ?? ''} ${item.wallet?.utilisateur?.nom ?? ''}`.toLowerCase();
      const dest = (item.destinataire ?? '').toLowerCase();
      const method = (item.methode ?? '').toLowerCase();
      return name.includes(q) || dest.includes(q) || method.includes(q);
    });
  }, [withdrawalsHistory, searchQuery]);

  // Exportation CSV Financière
  const handleExportCsv = () => {
    if (activeTab === 'WITHDRAWALS_PENDING' || activeTab === 'WITHDRAWALS_HISTORY') {
      const source = activeTab === 'WITHDRAWALS_PENDING' ? filteredPendingWithdrawals : filteredWithdrawalsHistory;
      if (source.length === 0) {
        showToast("Aucune donnée de retrait à exporter");
        return;
      }
      const headers = ["ID Retrait", "Demandeur", "Email", "Téléphone", "Méthode", "Destinataire", "Montant (XOF)", "Statut", "Date Demande"];
      const rows = source.map((w) => [
        w.id,
        `"${w.wallet?.utilisateur?.prenom ?? ""} ${w.wallet?.utilisateur?.nom ?? ""}"`,
        `"${w.wallet?.utilisateur?.email ?? ""}"`,
        `"${w.wallet?.utilisateur?.telephone ?? ""}"`,
        w.methode,
        `"${w.destinataire}"`,
        w.montant,
        w.statut,
        w.demandeeLe ? new Date(w.demandeeLe).toLocaleDateString("fr-FR") : "",
      ]);
      downloadCsv("klef_export_retraits", headers, rows);
    } else if (activeTab === 'TRANSACTIONS') {
      if (transactions.length === 0) {
        showToast("Aucune transaction à exporter");
        return;
      }
      const headers = ["ID Transaction", "Wallet ID", "Utilisateur", "Type", "Sens", "Montant (XOF)", "Solde Après", "Description", "Date"];
      const rows = transactions.map((t) => [
        t.id,
        t.walletId,
        `"${t.wallet?.utilisateur?.prenom ?? ""} ${t.wallet?.utilisateur?.nom ?? ""}"`,
        t.type,
        t.sens,
        t.montant,
        t.soldeApres,
        `"${t.description.replace(/"/g, '""')}"`,
        t.creeLe ? new Date(t.creeLe).toLocaleDateString("fr-FR") : "",
      ]);
      downloadCsv("klef_journal_transactions", headers, rows);
    } else if (activeTab === 'WEBHOOKS') {
      if (webhookLogs.length === 0) {
        showToast("Aucun log de webhook à exporter");
        return;
      }
      const headers = ["ID Log", "Provider", "Event Type", "Valide", "Erreur", "Date"];
      const rows = webhookLogs.map((wl) => [
        wl.id,
        wl.provider,
        `"${wl.eventType ?? ""}"`,
        wl.isValid ? "Oui" : "Non",
        `"${(wl.errorMessage ?? "").replace(/"/g, '""')}"`,
        wl.creeLe ? new Date(wl.creeLe).toLocaleDateString("fr-FR") : "",
      ]);
      downloadCsv("klef_logs_webhooks", headers, rows);
    } else if (activeTab === 'REFUNDS') {
      if (refunds.length === 0) {
        showToast("Aucun remboursement à exporter");
        return;
      }
      const headers = ["ID Remboursement", "Réservation ID", "Locataire", "Hôte", "Fournisseur", "Montant (XOF)", "Statut", "Date"];
      const rows = refunds.map((r) => [
        r.id,
        r.reservationId,
        `"${r.reservation?.locataire?.prenom ?? ""} ${r.reservation?.locataire?.nom ?? ""}"`,
        `"${r.reservation?.proprietaire?.prenom ?? ""} ${r.reservation?.proprietaire?.nom ?? ""}"`,
        r.paiement?.fournisseur ?? "",
        r.montant,
        r.statut,
        r.creeLe ? new Date(r.creeLe).toLocaleDateString("fr-FR") : "",
      ]);
      downloadCsv("klef_remboursements", headers, rows);
    }
  };

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exportation CSV réussie !");
  };

  // Actions administrateur retraits
  const handleValidateWithdrawal = async (item: RetraitPendingItem) => {
    try {
      await adminApi.validateWithdrawal(item.id);
      showToast(`Virement de ${item.montant.toLocaleString('fr-FR')} FCFA validé avec succès !`);
      loadData();
      loadPendingCount();
    } catch {
      showToast("Erreur lors de la validation du virement");
    }
  };

  const handleRejectWithdrawal = async (item: RetraitPendingItem, raison: string) => {
    try {
      await adminApi.rejectWithdrawal(item.id, raison);
      showToast(`Demande de retrait rejetée. Le solde a été recrédité à l'hôte.`);
      loadData();
      loadPendingCount();
    } catch {
      showToast("Erreur lors du rejet du virement");
    }
  };

  const handleRetryRefund = async (refundId: string) => {
    try {
      await adminApi.retryRefund(refundId);
      showToast("Remboursement relancé avec succès !");
      loadData();
    } catch {
      showToast("Erreur lors de la relance du remboursement");
    }
  };

  return (
    <AdminShell urgentCount={pendingCount}>
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <AdminFinanceHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => { loadData(); loadPendingCount(); }}
          isRefreshing={isLoading}
          onOpenAdjustmentModal={() => setIsAdjustmentModalOpen(true)}
          onExportCsv={handleExportCsv}
          pendingCount={pendingCount}
        />

        {/* Tab Content */}
        {activeTab === 'WITHDRAWALS_PENDING' && (
          <AdminPendingWithdrawalsTable
            withdrawals={filteredPendingWithdrawals}
            isLoading={isLoading}
            onValidate={(item) => { setSelectedWithdrawal(item); setIsRejectionAction(false); }}
            onReject={(item) => { setSelectedWithdrawal(item); setIsRejectionAction(true); }}
          />
        )}

        {activeTab === 'WITHDRAWALS_HISTORY' && (
          <AdminWithdrawalsHistoryTable
            history={filteredWithdrawalsHistory}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'TRANSACTIONS' && (
          <AdminWalletTransactionsTable
            transactions={transactions}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'WEBHOOKS' && (
          <AdminWebhookLogsTable
            logs={webhookLogs}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'REFUNDS' && (
          <AdminRefundsTable
            refunds={refunds}
            isLoading={isLoading}
            onRetryRefund={handleRetryRefund}
          />
        )}

        {/* Adjustment Modal */}
        <AdminWalletAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          onSuccess={(msg) => { showToast(msg); loadData(); }}
        />

        {/* Withdrawal Action Modal */}
        <AdminWithdrawalActionModal
          item={selectedWithdrawal}
          isOpen={Boolean(selectedWithdrawal)}
          isRejection={isRejectionAction}
          onClose={() => setSelectedWithdrawal(null)}
          onConfirmValidate={handleValidateWithdrawal}
          onConfirmReject={handleRejectWithdrawal}
        />
      </div>
    </AdminShell>
  );
}
