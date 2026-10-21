import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.errorCard}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={32} color={colors.error[600]} />
              </View>

              <Text style={styles.title}>Oups ! Une erreur est survenue</Text>
              <Text style={styles.subtitle}>
                L'application a rencontré un problème inattendu. Nous avons sécurisé la session pour éviter tout problème.
              </Text>

              {this.state.error?.message && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText} numberOfLines={3}>
                    {this.state.error.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={this.handleReset}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Recharger l'application"
              >
                <RefreshCw size={16} color={colors.forest[950]} />
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: colors.neutral[100],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  detailsText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    marginTop: 6,
    width: '100%',
    ...shadows.action,
  },
  retryBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
