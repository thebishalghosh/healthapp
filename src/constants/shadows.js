import { Platform } from 'react-native';

const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#24493A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    floating: {
      shadowColor: '#183F31',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  },
  android: {
    card: {
      elevation: 4,
    },
    floating: {
      elevation: 8,
    },
  },
});

export default shadows;
