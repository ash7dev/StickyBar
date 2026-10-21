import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

export type AnimationPreset =
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'zoomFade'
  | 'fade';

export interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  preset?: AnimationPreset;
  type?: 'spring' | 'timing';
  duration?: number;
  delay?: number;
  distance?: number;
  bounciness?: number;
  speed?: number;
  disabled?: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedScreenWrapper({
  children,
  style,
  preset = 'slideUp',
  type = 'spring',
  duration = 350,
  delay = 0,
  distance = 24,
  bounciness = 5,
  speed = 12,
  disabled = false,
  onAnimationComplete,
}: AnimatedScreenWrapperProps) {
  // ── Animated values ──────────────────────────────────────────
  const opacityAnim = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const translateYAnim = useRef(
    new Animated.Value(
      disabled
        ? 0
        : preset === 'slideUp'
        ? distance
        : preset === 'slideDown'
        ? -distance
        : 0
    )
  ).current;
  const translateXAnim = useRef(
    new Animated.Value(
      disabled
        ? 0
        : preset === 'slideLeft'
        ? distance
        : preset === 'slideRight'
        ? -distance
        : 0
    )
  ).current;
  const scaleAnim = useRef(
    new Animated.Value(
      disabled
        ? 1
        : preset === 'scale'
        ? 0.93
        : preset === 'zoomFade'
        ? 1.05
        : 1
    )
  ).current;

  useEffect(() => {
    if (disabled) return;

    // Reset initial values
    opacityAnim.setValue(0);
    if (preset === 'slideUp') translateYAnim.setValue(distance);
    else if (preset === 'slideDown') translateYAnim.setValue(-distance);
    else translateYAnim.setValue(0);

    if (preset === 'slideLeft') translateXAnim.setValue(distance);
    else if (preset === 'slideRight') translateXAnim.setValue(-distance);
    else translateXAnim.setValue(0);

    if (preset === 'scale') scaleAnim.setValue(0.93);
    else if (preset === 'zoomFade') scaleAnim.setValue(1.05);
    else scaleAnim.setValue(1);

    const opacityConfig: Animated.TimingAnimationConfig = {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    };

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacityAnim, opacityConfig),
    ];

    if (preset === 'slideUp' || preset === 'slideDown') {
      if (type === 'spring') {
        animations.push(
          Animated.spring(translateYAnim, {
            toValue: 0,
            bounciness,
            speed,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          })
        );
      }
    }

    if (preset === 'slideLeft' || preset === 'slideRight') {
      if (type === 'spring') {
        animations.push(
          Animated.spring(translateXAnim, {
            toValue: 0,
            bounciness,
            speed,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          })
        );
      }
    }

    if (preset === 'scale' || preset === 'zoomFade') {
      if (type === 'spring') {
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            bounciness,
            speed,
            useNativeDriver: true,
          })
        );
      } else {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          })
        );
      }
    }

    const parallelAnim = Animated.parallel(animations);

    let timer: ReturnType<typeof setTimeout>;
    if (delay > 0) {
      timer = setTimeout(() => {
        parallelAnim.start(() => {
          onAnimationComplete?.();
        });
      }, delay);
    } else {
      parallelAnim.start(() => {
        onAnimationComplete?.();
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
      parallelAnim.stop();
    };
  }, [preset, type, duration, delay, distance, bounciness, speed, disabled]);

  if (disabled) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  const transformStyle: any[] = [];
  if (preset === 'slideUp' || preset === 'slideDown') {
    transformStyle.push({ translateY: translateYAnim });
  }
  if (preset === 'slideLeft' || preset === 'slideRight') {
    transformStyle.push({ translateX: translateXAnim });
  }
  if (preset === 'scale' || preset === 'zoomFade') {
    transformStyle.push({ scale: scaleAnim });
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: opacityAnim,
          transform: transformStyle,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
