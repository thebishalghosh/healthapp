import React from 'react';
import { Text } from 'react-native';
import typography from '../../constants/typography';
import colors from '../../constants/colors';

export default function AppText({ children, style, weight = 'regular', size }) {
  const fontSize = size || typography.sizes.body;
  return (
    <Text
      style={[
        { fontFamily: typography.fontFamily, fontSize, color: colors.text, fontWeight: typography.weights[weight] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
