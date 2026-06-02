import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Providers } from './Providers';
import { Navigation } from './Navigation';
import { useTheme } from '@/theme/ThemeContext';

function AppContent() {
  const { colorMode } = useTheme();
  const barStyle = colorMode === 'light' ? 'dark' : 'light';

  return (
    <>
      <StatusBar style={barStyle} />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
