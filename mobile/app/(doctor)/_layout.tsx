import { Tabs } from 'expo-router';
import { BottomNav } from '../../src/ui/BottomNav';

export default function DoctorTabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="overview" />
      <Tabs.Screen name="patients" />
      <Tabs.Screen name="signals" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
