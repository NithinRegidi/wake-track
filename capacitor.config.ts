import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.92b53854abbd4d04af7ea1b32bedcbc1',
  appName: 'wake-track',
  webDir: 'dist',
  server: {
    url: 'https://92b53854-abbd-4d04-af7e-a1b32bedcbc1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;