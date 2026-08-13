import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Image, ScrollView, useWindowDimensions, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../components/ui/GradientBackground';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';

const pages = [
  {
    title: 'Understand Your Body',
    subtitle: 'Get personalized insights based on your nutrition, activity and lifestyle.',
  },
  {
    title: 'Eat Smarter',
    subtitle: 'Get AI-powered meal recommendations designed around your goals and preferences.',
  },
  {
    title: 'Build Better Habits',
    subtitle: 'Track your water, meals, workouts and sleep while building lasting habits.',
  },
];

export default function Welcome() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  const imageSource = require('../../../assets/images/onboarding-photo.jpg');

  // Resolve intrinsic image size to preserve aspect ratio
  const imgSize = useMemo(() => {
    const s = RNImage.resolveAssetSource(imageSource);
    return { w: s.width || 1, h: s.height || 1 };
  }, [imageSource]);

  const imageHeight = Math.min(Math.round((width - 48) * (imgSize.h / imgSize.w)), Math.round(height * 0.45));

  const goNext = () => {
    if (page < pages.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    } else {
      router.push('/(setup)/goals');
    }
  };

  const onMomentum = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const current = Math.round(x / width);
    setPage(current);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
          <AppText weight="semibold" size={20}>HealthAI</AppText>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="start"
            onMomentumScrollEnd={onMomentum}
            contentContainerStyle={{}}
            style={{ flex: 1 }}
          >
            {pages.map((p, i) => (
              <View key={i} style={[styles.page, { width, paddingHorizontal: 24 }]}> 
                <View style={[styles.hero, { height: imageHeight }]}> 
                  <Image source={imageSource} style={[styles.image, { height: imageHeight }]} resizeMode="cover" />
                </View>
                <AppText style={styles.title} weight="semibold" size={26}>{p.title}</AppText>
                <AppText style={styles.subtitle}>{p.subtitle}</AppText>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, paddingHorizontal: 24 }]}> 
          <View style={styles.pagination} pointerEvents="none">
            {pages.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === page && styles.dotActive]} />
            ))}
          </View>
          <PrimaryButton title={page === pages.length - 1 ? 'Get Started' : 'Next'} onPress={goNext} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, justifyContent: 'center' },
  page: { justifyContent: 'flex-start' },
  hero: { alignItems: 'center', marginBottom: 18 },
  image: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  title: { textAlign: 'left', marginBottom: 12 },
  subtitle: { color: colors.secondaryText, marginBottom: 16 },
  footer: { paddingTop: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E6EEF9', marginHorizontal: 6 },
  dotActive: { backgroundColor: colors.primary },
});
