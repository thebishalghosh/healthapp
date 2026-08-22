import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import colors from '../../constants/colors';

export default function SectionHeader({ eyebrow, title, action }) {
  return (
    <View style={styles.row}>
      <View>
        {eyebrow ? <AppText weight="semibold" style={styles.eyebrow}>{eyebrow.toUpperCase()}</AppText> : null}
        <AppText weight="semibold" size={20}>{title}</AppText>
      </View>
      {action ? <AppText weight="semibold" style={styles.action}>{action}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, marginBottom: 5 },
  action: { color: colors.primary, fontSize: 13 },
});
