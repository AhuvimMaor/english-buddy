import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Platform } from 'react-native';

export async function requestPermissions(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

export async function getPermissionStatus(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
  return result.granted;
}

export function startListening(lang: 'en-US' | 'he-IL' = 'en-US'): void {
  ExpoSpeechRecognitionModule.start({
    lang,
    interimResults: true,
    continuous: lang === 'en-US', // Hebrew mode: single utterance, then switch back
    ...(Platform.OS === 'android' && {
      androidIntentOptions: {
        EXTRA_ENABLE_LANGUAGE_DETECTION: true,
        EXTRA_ENABLE_LANGUAGE_SWITCH: 'balanced' as const,
      },
    }),
  });
}

export function stopListening(): void {
  ExpoSpeechRecognitionModule.stop();
}

export { useSpeechRecognitionEvent };
