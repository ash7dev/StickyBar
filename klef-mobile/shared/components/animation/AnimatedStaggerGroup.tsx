import React from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';
import { AnimatedScreenWrapper, AnimationPreset } from './AnimatedScreenWrapper';

export interface AnimatedStaggerItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  preset?: AnimationPreset;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedStaggerItem({
  children,
  index,
  staggerDelay = 50,
  preset = 'slideUp',
  distance = 16,
  style,
}: AnimatedStaggerItemProps) {
  const calculatedDelay = Math.min(index * staggerDelay, 400);

  return (
    <AnimatedScreenWrapper
      preset={preset}
      delay={calculatedDelay}
      distance={distance}
      style={style}
    >
      {children}
    </AnimatedScreenWrapper>
  );
}

export interface AnimatedStaggerGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  preset?: AnimationPreset;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedStaggerGroup({
  children,
  staggerDelay = 50,
  preset = 'slideUp',
  distance = 16,
  style,
}: AnimatedStaggerGroupProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={style}>
      {childrenArray.map((child, index) => (
        <AnimatedStaggerItem
          key={index}
          index={index}
          staggerDelay={staggerDelay}
          preset={preset}
          distance={distance}
        >
          {child}
        </AnimatedStaggerItem>
      ))}
    </View>
  );
}
