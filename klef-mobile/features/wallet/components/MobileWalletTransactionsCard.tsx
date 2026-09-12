import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Building2,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { WalletTransaction } from '../types/wallet.types';

interface MobileWalletTransactionsCardProps {
  transactions: WalletTransaction[];
}

export function MobileWalletTransactionsCard({ transactions }: MobileWalletTransactionsCardProps) {
  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTxConfig = (tx: WalletTransaction) => {
    const isCredit = tx.sens === 'CREDIT' || tx.type === 'CREDIT_LOCATION';
    switch (tx.type) {
      case 'CREDIT_LOCATION':
        return {
          label: 'Revenu de réservation',
          icon: ArrowDownLeft,
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          amountColor: '#059669',
          prefix: '+ ',
        };
      case 'DEBIT_RETRAIT':
        return {
          label: 'Retrait de solde',
          icon: ArrowUpRight,
          iconBg: colors.neutral[100],
          iconColor: colors.neutral[700],
          amountColor: colors.neutral[900],
          prefix: '- ',
        };
      case 'DEBIT_PENALITE':
      case 'DEBIT_DETTE':
        return {
          label: 'Déduction / Pénalité',
          icon: AlertTriangle,
          iconBg: colors.error[50],
          iconColor: colors.error[600],
          amountColor: colors.error[700],
          prefix: '- ',
        };
      case 'REMBOURSEMENT':
        return {
          label: 'Remboursement voyageur',
          icon: RotateCcw,
          iconBg: 'rgba(59, 130, 246, 0.12)',
          iconColor: '#2563EB',
          amountColor: isCredit ? '#059669' : colors.error[700],
          prefix: isCredit ? '+ ' : '- ',
        };
      default:
        return {
          label: tx.description || tx.type,
          icon: isCredit ? ArrowDownLeft : ArrowUpRight,
          iconBg: isCredit ? '#ECFDF5' : colors.neutral[100],
          iconColor: isCredit ? '#059669' : colors.neutral[700],
          amountColor: isCredit ? '#059669' : colors.neutral[900],
          prefix: isCredit ? '+ ' : '- ',
        };
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <Receipt size={18} color={colors.forest[800]} />
          <Text style={styles.headerTitle}>Historique des Transactions</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.emptyContainer}>
          <Building2 size={32} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>Aucune transaction enregistrée</Text>
          <Text style={styles.emptySub}>
            Vos crédits de séjour et retraits Wave / Orange Money s'afficheront ici.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Receipt size={18} color={colors.forest[800]} />
        <Text style={styles.headerTitle}>Historique des Transactions</Text>
        <Text style={styles.txCountBadge}>{transactions.length} récents</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.listBody}>
        {transactions.map((tx, idx) => {
          const cfg = getTxConfig(tx);
          const IconComp = cfg.icon;
          const isLast = idx === transactions.length - 1;

          return (
            <View key={tx.id || `tx-${idx}`}>
              <View style={styles.txRow}>
                <View style={[styles.txIconCircle, { backgroundColor: cfg.iconBg }]}>
                  <IconComp size={16} color={cfg.iconColor} />
                </View>

                <View style={styles.txMainCol}>
                  <Text style={styles.txLabel} numberOfLines={1}>
                    {cfg.label}
                  </Text>
                  {tx.description ? (
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description}
                    </Text>
                  ) : null}
                  <Text style={styles.txDate}>{formatDate(tx.creeLe)}</Text>
                </View>

                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, { color: cfg.amountColor }]}>
                    {cfg.prefix}{formatPrice(tx.montant)}
                  </Text>
                  <Text style={styles.soldeApresText}>
                    Solde : {formatPrice(tx.soldeApres)}
                  </Text>
                </View>
              </View>

              {!isLast && <View style={styles.rowDivider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.neutral[900],
    flex: 1,
  },
  txCountBadge: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    backgroundColor: colors.neutral[100],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  listBody: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMainCol: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  txDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  txDate: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
  },
  soldeApresText: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[400],
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 6,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[800],
  },
  emptySub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
