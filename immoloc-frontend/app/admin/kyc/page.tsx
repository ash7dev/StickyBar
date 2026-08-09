'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminKycHeaderBar } from '@/features/admin/components/kyc/AdminKycHeaderBar';
import { AdminKycTable, KycUserItem } from '@/features/admin/components/kyc/AdminKycTable';
import { AdminKycInspectionModal } from '@/features/admin/components/kyc/AdminKycInspectionModal';
import { AdminKycRejectModal } from '@/features/admin/components/kyc/AdminKycRejectModal';
import { adminApi } from '@/lib/nestjs';

export default function AdminKycPage() {
  const [users, setUsers] = useState<KycUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE'>('EN_ATTENTE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [inspectUser, setInspectUser] = useState<KycUserItem | null>(null);
  const [rejectUser, setRejectUser] = useState<KycUserItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadKycList = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.listKyc();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      showToast('Erreur lors du chargement des dossiers KYC');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKycList();
  }, [loadKycList]);

  // Statistics counts
  const counts = useMemo(() => {
    return {
      all: users.length,
      pending: users.filter((u) => u.statutKyc === 'EN_ATTENTE').length,
      verified: users.filter((u) => u.statutKyc === 'VERIFIE').length,
      rejected: users.filter((u) => u.statutKyc === 'REJETE').length,
    };
  }, [users]);

  // Filtered & Searched users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab !== 'ALL' && u.statutKyc !== activeTab) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = `${u.prenom ?? ''} ${u.nom ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const phone = (u.telephone ?? '').toLowerCase();

      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, activeTab, searchQuery]);

  // Handle Verify Action
  const handleVerify = async (user: KycUserItem) => {
    try {
      await adminApi.verifyKyc(user.id);
      showToast(`Dossier KYC de ${user.prenom ?? ''} ${user.nom ?? ''} validé avec succès !`);
      loadKycList();
    } catch {
      showToast('Erreur lors de la validation du KYC');
    }
  };

  // Handle Reject Action
  const handleConfirmReject = async (user: KycUserItem, reason: string) => {
    try {
      await adminApi.rejectKyc(user.id, reason);
      showToast(`Dossier KYC de ${user.prenom ?? ''} ${user.nom ?? ''} rejeté.`);
      loadKycList();
    } catch {
      showToast('Erreur lors du rejet du KYC');
    }
  };

  // Handle Flag Renewal
  const handleFlagRenewal = async (user: KycUserItem) => {
    try {
      await adminApi.flagKycRenewal(user.id);
      showToast(`Dossier de ${user.prenom ?? ''} marqué pour renouvellement.`);
      loadKycList();
    } catch {
      showToast('Erreur lors du marquage');
    }
  };

  return (
    <AdminShell urgentCount={counts.pending}>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-card border border-forest-300 bg-forest-900 px-4 py-3 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* 1. Header Bar & Controls */}
        <AdminKycHeaderBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadKycList}
          isRefreshing={isLoading}
          counts={counts}
        />

        {/* 2. Table of KYC submissions */}
        <AdminKycTable
          users={filteredUsers}
          isLoading={isLoading}
          onInspect={setInspectUser}
          onVerify={handleVerify}
          onReject={setRejectUser}
          onFlagRenewal={handleFlagRenewal}
        />

        {/* 3. Inspection Modal */}
        <AdminKycInspectionModal
          user={inspectUser}
          isOpen={Boolean(inspectUser)}
          onClose={() => setInspectUser(null)}
          onVerify={handleVerify}
          onReject={setRejectUser}
        />

        {/* 4. Reject Modal */}
        <AdminKycRejectModal
          user={rejectUser}
          isOpen={Boolean(rejectUser)}
          onClose={() => setRejectUser(null)}
          onConfirmReject={handleConfirmReject}
        />
      </div>
    </AdminShell>
  );
}
