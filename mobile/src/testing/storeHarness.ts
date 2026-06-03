/**
 * Test helpers for the Zustand store. `seedStore` resets it to the deterministic
 * demo seed so each screen/integration test starts from a known state.
 */

import { useAppStore } from '../store/useAppStore';

export function seedStore(): void {
  useAppStore.setState({ hydrated: true, role: 'patient' });
  useAppStore.getState().resetDemo();
}
