import { Platform } from 'react-native';

const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#0b1724',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
  },
  android: {
    card: {
      elevation: 6,
    },
  },
});

export default shadows;
