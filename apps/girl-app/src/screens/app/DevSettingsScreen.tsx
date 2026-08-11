import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  DevSettings,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Server,
  Globe,
  RefreshCw,
  Laptop,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import * as Updates from 'expo-updates';
import apiClient from '../../api/apiClient';
import {
  getBackendMode,
  getLocalHost,
  getApiBaseUrl,
  getSocketBaseUrl,
  setBackendMode,
  BackendMode,
  PRODUCTION_API_URL,
  PRODUCTION_SOCKET_URL,
  DEFAULT_LOCAL_HOST,
} from '../../config/backendConfig';

export default function DevSettingsScreen() {
  const navigation = useNavigation<any>();

  const [mode, setMode] = useState<BackendMode>('production');
  const [localHostInput, setLocalHostInput] = useState<string>('');
  const [activeApiUrl, setActiveApiUrl] = useState<string>('');
  const [activeSocketUrl, setActiveSocketUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const currentMode = await getBackendMode();
      const savedHost = await getLocalHost();
      const apiUrl = await getApiBaseUrl();
      const socketUrl = await getSocketBaseUrl();

      setMode(currentMode);
      setLocalHostInput(savedHost || DEFAULT_LOCAL_HOST);
      setActiveApiUrl(apiUrl);
      setActiveSocketUrl(socketUrl);
    } catch (err) {
      console.warn('Failed to load dev settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (isLocal: boolean) => {
    const newMode: BackendMode = isLocal ? 'local' : 'production';
    setMode(newMode);
  };

  const handleSaveAndRestart = async () => {
    const targetHost = localHostInput.trim() || DEFAULT_LOCAL_HOST;
    if (mode === 'local' && !targetHost) {
      Alert.alert('Validation Error', 'Please enter a local host (e.g. 192.168.1.106:5000).');
      return;
    }

    setSaving(true);
    try {
      await setBackendMode(mode, targetHost);

      // Update displayed active URLs & mode
      const newMode = await getBackendMode();
      const newApiUrl = await getApiBaseUrl();
      const newSocketUrl = await getSocketBaseUrl();

      setMode(newMode);
      setActiveApiUrl(newApiUrl);
      setActiveSocketUrl(newSocketUrl);

      // Instantly update apiClient default baseURL
      apiClient.defaults.baseURL = newApiUrl;

      // Brief delay to allow storage write to finish
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }

      // Attempt app reload (Expo Updates or RN DevSettings)
      let reloaded = false;
      if (Updates && typeof Updates.reloadAsync === 'function') {
        try {
          await Updates.reloadAsync();
          reloaded = true;
          return;
        } catch (reloadErr) {
          console.warn('Expo Updates.reloadAsync fallback:', reloadErr);
        }
      }

      if (!reloaded && DevSettings && typeof DevSettings.reload === 'function') {
        try {
          DevSettings.reload();
          reloaded = true;
          return;
        } catch (devErr) {
          console.warn('DevSettings.reload fallback:', devErr);
        }
      }

      Alert.alert(
        'Backend Settings Saved',
        `Environment set to ${mode.toUpperCase()}.\n\nAPI URL:\n${newApiUrl}\n\nSocket URL:\n${newSocketUrl}\n\nActive environment updated. Please reload your Expo app or dev server to connect.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save backend configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#f43f5e" />
        <Text className="text-slate-400 mt-4 text-sm font-medium">Loading Developer Config...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
        >
          <ArrowLeft color="#ffffff" size={20} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold text-white tracking-tight">Developer Settings</Text>
          <Text className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">
            Runtime Switcher
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Active Config Summary Card */}
        <View className="bg-slate-800 rounded-3xl p-5 border border-slate-700 mb-6 shadow-lg">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Server size={18} color="#fb7185" />
              <Text className="text-sm font-bold text-white uppercase tracking-wider">
                Current Active Backend
              </Text>
            </View>

            <View
              className={`px-3 py-1 rounded-full border ${
                mode === 'production'
                  ? 'bg-emerald-500/20 border-emerald-500/40'
                  : 'bg-amber-500/20 border-amber-500/40'
              }`}
            >
              <Text
                className={`text-[11px] font-extrabold uppercase ${
                  mode === 'production' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {mode}
              </Text>
            </View>
          </View>

          <View className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 mb-2">
            <View className="mb-2">
              <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                API Base URL
              </Text>
              <Text className="text-xs font-mono text-rose-300" numberOfLines={2}>
                {activeApiUrl}
              </Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Socket URL
              </Text>
              <Text className="text-xs font-mono text-emerald-300" numberOfLines={2}>
                {activeSocketUrl}
              </Text>
            </View>
          </View>
        </View>

        {/* Mode Selector */}
        <View className="bg-slate-800 rounded-3xl p-5 border border-slate-700 mb-6 shadow-lg">
          <Text className="text-base font-bold text-white mb-4">Select Target Environment</Text>

          {/* Production Toggle */}
          <TouchableOpacity
            onPress={() => handleModeChange(false)}
            className={`p-4 rounded-2xl border mb-3 flex-row items-center justify-between ${
              mode === 'production'
                ? 'bg-rose-950/40 border-rose-500'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-10 h-10 rounded-full bg-rose-500/20 items-center justify-center border border-rose-500/30">
                <Globe size={20} color="#fb7185" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Production (Render Cloud)</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                  {PRODUCTION_SOCKET_URL}
                </Text>
              </View>
            </View>
            {mode === 'production' && <CheckCircle size={20} color="#f43f5e" />}
          </TouchableOpacity>

          {/* Local Toggle */}
          <TouchableOpacity
            onPress={() => handleModeChange(true)}
            className={`p-4 rounded-2xl border flex-row items-center justify-between ${
              mode === 'local'
                ? 'bg-amber-950/40 border-amber-500'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center border border-amber-500/30">
                <Laptop size={20} color="#fbbf24" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">Local Development</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  Connect to local server on LAN IP
                </Text>
              </View>
            </View>
            {mode === 'local' && <CheckCircle size={20} color="#f59e0b" />}
          </TouchableOpacity>

          {/* Local Host Input */}
          {mode === 'local' && (
            <View className="mt-5 pt-4 border-t border-slate-700/80">
              <Text className="text-xs font-bold text-slate-300 mb-2">
                Local Host & Port (e.g. 192.168.1.106:5000)
              </Text>
              <TextInput
                value={localHostInput}
                onChangeText={setLocalHostInput}
                placeholder="192.168.1.106:5000"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                className="bg-slate-900 text-white font-mono text-sm px-4 py-3.5 rounded-2xl border border-slate-700"
              />
              <View className="flex-row items-start gap-1.5 mt-2 px-1">
                <AlertCircle size={14} color="#94a3b8" className="mt-0.5" />
                <Text className="text-[11px] text-slate-400 flex-1 leading-tight">
                  Enter your computer's local IP address and port. Do not include http:// or /api/v1.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Save & Restart CTA Button */}
        <TouchableOpacity
          onPress={handleSaveAndRestart}
          disabled={saving}
          className="bg-rose-600 active:bg-rose-700 p-4.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <RefreshCw size={18} color="#ffffff" />
              <Text className="text-white font-extrabold text-base">Save & Restart App</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
