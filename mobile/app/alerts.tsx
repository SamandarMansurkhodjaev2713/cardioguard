import { useRouter } from 'expo-router';
import { AlertsView } from '../src/features/AlertsView';

export default function AlertsScreen() {
  const router = useRouter();
  return <AlertsView onBack={() => router.back()} />;
}
