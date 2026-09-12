import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

export interface TerangaTransaction {
  id: string;
  type?: string;
  montantCoins: number;
  sens?: 'CREDIT' | 'DEBIT' | string;
  description: string;
  creeLe: string;
}

interface MobileTerangaHistoryProps {
  transactions?: TerangaTransaction[];
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function MobileTerangaHistory({ transactions = [] }: MobileTerangaHistoryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <History size={16} color={colors.forest[700]} />
        </View>
        <Text style={styles.headerTitle}>Historique des coins</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aucune transaction enregistrée pour le moment.</Text>
        </View>
      ) : (
        <View style={styles.listStack}>
          {transactions.map((tx) => {
            const isCredit = tx.sens === 'CREDIT' || tx.montantCoins > 0;
            const amountAbs = Math.abs(tx.montantCoins);

            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIconCircle, isCredit ? styles.creditCircle : styles.debitCircle]}>
                  {isCredit ? (
                    <ArrowDownLeft size={14} color={colors.success[700]} />
                  ) : (
                    <ArrowUpRight size={14} color={colors.error[600]} />
                  )}
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description || 'Transaction Teranga Coins'}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(tx.creeLe)}</Text>
                </View>

                <Text style={[styles.txAmount, isCredit ? styles.creditAmount : styles.debitAmount]}>
                  {isCredit ? '+' : '-'}{amountAbs.toLocaleString('fr-FR')} coins
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },

  listStack: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCircle: {
    backgroundColor: colors.success[50],
  },
  debitCircle: {
    backgroundColor: colors.error[50],
  },
  txInfo: {
    flex: 1,
    gap: 1,
  },
  txDesc: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  txDate: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  txAmount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
  },
  creditAmount: {
    color: colors.success[700],
  },
  debitAmount: {
    color: colors.error[600],
  },
});
