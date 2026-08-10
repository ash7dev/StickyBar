'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  AdminReviewsHeaderBar,
  type ReviewRatingFilter,
  type ReviewTypeFilter,
} from '@/features/admin/components/reviews/AdminReviewsHeaderBar';
import { AdminReviewsStatsOverview } from '@/features/admin/components/reviews/AdminReviewsStatsOverview';
import { AdminReviewsTable, type ReviewItem } from '@/features/admin/components/reviews/AdminReviewsTable';
import { AdminReviewDetailModal } from '@/features/admin/components/reviews/AdminReviewDetailModal';
import { AdminReviewDeleteModal } from '@/features/admin/components/reviews/AdminReviewDeleteModal';
import { AdminReviewsPagination } from '@/features/admin/components/reviews/AdminReviewsPagination';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReviewTypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  /* Terme débouncé : `loadReviews` dépendait directement de `searchQuery`,
     donc une requête partait à chaque frappe. */
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  const [inspectTarget, setInspectTarget] = useState<ReviewItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mounted = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Garde de course : sans elle, la réponse de « Dia » arrivant après celle
     de « Diallo » écrasait les bons résultats. */
  const requestSeq = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* Le toast affichait erreurs et succès dans le même encadré vert :
     « Erreur lors du chargement » s'annonçait comme une confirmation. */
  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 5000);
  }, []);

  const loadReviews = useCallback(async (page = 1) => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    try {
      const params: Parameters<typeof adminApi.listReviews>[0] = {
        page,
        limit: PAGE_SIZE,
        ...(typeFilter !== 'ALL' && { typeAvis: typeFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(ratingFilter === 'CRITICAL' && { maxNote: 2 }),
        ...(ratingFilter === 'EXCELLENT' && { minNote: 5, maxNote: 5 }),
      };

      const result = await adminApi.listReviews(params);
      if (!mounted.current || seq !== requestSeq.current) return;

      setReviews(result?.data ?? []);
      if (result?.meta) setMeta(result.meta);
    } catch {
      if (!mounted.current || seq !== requestSeq.current) return;
      /* `if (result?.data)` laissait les anciens avis à l'écran en cas
         d'échec : l'admin croyait consulter des données à jour. */
      setReviews([]);
      notify('error', 'Impossible de charger les avis.');
    } finally {
      if (mounted.current && seq === requestSeq.current) setIsLoading(false);
    }
  }, [ratingFilter, typeFilter, debouncedSearch, notify]);

  useEffect(() => {
    setCurrentPage(1);
    loadReviews(1);
  }, [loadReviews]);

  const handleConfirmDelete = useCallback(async (review: ReviewItem) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteReview(review.id);
      if (!mounted.current) return;
      notify('success', 'Avis supprimé. Les notes moyennes ont été recalculées.');
      setDeleteTarget(null);

      /* Supprimer le dernier avis d'une page laissait l'admin sur une page
         vide au lieu de reculer d'un cran. */
      const isLastOnPage = reviews.length === 1 && currentPage > 1;
      const nextPage = isLastOnPage ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      loadReviews(nextPage);
    } catch (err) {
      if (!mounted.current) return;
      notify(
        'error',
        err instanceof Error && err.message ? err.message : 'La suppression n’a pas abouti.',
      );
    } finally {
      if (mounted.current) setIsDeleting(false);
    }
  }, [isDeleting, reviews.length, currentPage, loadReviews, notify]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadReviews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadReviews]);

  return (
    <AdminShell>
      <div className="space-y-6">

        {toast && (
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'fixed right-6 bottom-6 z-100 rounded-card border px-4 py-3 text-xs font-semibold shadow-xl',
              toast.type === 'error'
                ? 'border-error-500/25 bg-error-50 text-error-700'
                : 'border-success-500/25 bg-success-50 text-success-700',
            )}
          >
            {toast.message}
          </div>
        )}

        <AdminReviewsHeaderBar
          activeRatingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          activeTypeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => loadReviews(currentPage)}
          isRefreshing={isLoading}
          totalCount={meta.total}
        />

        {/* ⚠️ `reviews` ne contient que la page courante : les statistiques
            sont donc calculées sur 20 avis maximum tout en affichant
            `totalCount` à côté. Une « note moyenne » sur la page 3 ne veut
            rien dire. À faire calculer par l'API sur l'ensemble du jeu
            filtré, sinon ce bloc induit en erreur. */}
        <AdminReviewsStatsOverview reviews={reviews} totalCount={meta.total} />

        <AdminReviewsTable
          reviews={reviews}
          isLoading={isLoading}
          onInspectReview={setInspectTarget}
          onDeleteReview={setDeleteTarget}
        />

        <AdminReviewsPagination
          page={currentPage}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={handlePageChange}
        />

        <AdminReviewDetailModal
          review={inspectTarget}
          isOpen={Boolean(inspectTarget)}
          onClose={() => setInspectTarget(null)}
          onDeleteRequest={(r) => { setInspectTarget(null); setDeleteTarget(r); }}
        />

        <AdminReviewDeleteModal
          review={deleteTarget}
          isOpen={Boolean(deleteTarget)}
          isDeleting={isDeleting}
          onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
          onConfirmDelete={handleConfirmDelete}
        />
      </div>
    </AdminShell>
  );
}