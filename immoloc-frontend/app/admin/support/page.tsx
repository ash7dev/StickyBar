'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Headphones, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/nestjs';
import { AdminSupportStatsOverview } from '@/features/admin/components/support/AdminSupportStatsOverview';
import { AdminSupportTicketsList } from '@/features/admin/components/support/AdminSupportTicketsList';
import { AdminSupportTicketDetail } from '@/features/admin/components/support/AdminSupportTicketDetail';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.statut = statusFilter;
      if (categoryFilter !== 'ALL') params.categorie = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminApi.listTickets(params);
      const list = Array.isArray(res) ? res : [];
      setTickets(list);

      // Auto-select first ticket if none selected or if selected ID no longer exists
      if (list.length > 0) {
        if (!selectedTicketId || !list.some((t) => t.id === selectedTicketId)) {
          setSelectedTicketId(list[0].id);
          fetchTicketDetails(list[0].id);
        } else {
          fetchTicketDetails(selectedTicketId);
        }
      } else {
        setSelectedTicket(null);
      }
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, categoryFilter, search, selectedTicketId]);

  const fetchTicketDetails = async (id: string) => {
    try {
      const details = await adminApi.getTicketDetails(id);
      setSelectedTicket(details);
    } catch {
      // Silently handle
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = (t: any) => {
    setSelectedTicketId(t.id);
    setSelectedTicket(t);
    fetchTicketDetails(t.id);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTickets();
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Headphones className="h-6 w-6 text-forest-700" /> Centre de Support Client & Assistance
            </h1>
            <p className="text-xs text-foreground-muted">
              Gestion centralisée des réclamations, assistance technique et tickets d'aide voyageurs & hôtes.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-forest-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* 1. KPIs Summary Overview */}
        <AdminSupportStatsOverview tickets={tickets} />

        {/* 2. Master-Detail Console Layout (2 columns) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Tickets Stream (1 col) */}
          <div className="lg:col-span-1">
            <AdminSupportTicketsList
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onSelectTicket={handleSelectTicket}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Active Ticket Workspace (2 cols) */}
          <div className="lg:col-span-2">
            <AdminSupportTicketDetail
              ticket={selectedTicket}
              onRefresh={fetchTickets}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
