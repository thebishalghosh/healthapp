import React from 'react';
import { Text } from 'react-native';
import typography from '../../constants/typography';
import colors from '../../constants/colors';

export default function AppText({ children, style, weight = 'regular', size }) {
  const fontSize = size || typography.sizes.body;
  return (
    <Text
      style={[
        { fontFamily: typography.fontFamily, fontSize, color: colors.text, fontWeight: typography.weights[weight], lineHeight: size >= 28 ? size * 1.16 : size <= 12 ? 16 : size * 1.45 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
