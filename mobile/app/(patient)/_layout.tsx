import { Tabs } from 'expo-router';
import { BottomNav } from '../../src/ui/BottomNav';

export default function PatientTabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="monitoring" />
      <Tabs.Screen name="medication" />
      <Tabs.Screen name="risk" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
