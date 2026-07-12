import { settingsRepository } from '@/repositories/settings.repository';
import { IPlatformSetting } from '@/types/models.type';

class SettingsService {
  async getSettings(): Promise<IPlatformSetting> {
    // Caching Strategy: Settings can be fetched frequently by the frontend on startup.
    // In the future, this can be cached in Redis with a 5-minute TTL or invalidated upon update.
    return await settingsRepository.getSettings();
  }

  async updateSettings(updateData: Partial<IPlatformSetting>): Promise<IPlatformSetting> {
    const updatedSettings = await settingsRepository.updateSettings(updateData);
    // Caching Strategy: Invalidate the Redis cache for settings here in the future.
    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
