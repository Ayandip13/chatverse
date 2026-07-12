import { PlatformSetting } from '@/models';
import { IPlatformSetting } from '@/types/models.type';

class SettingsRepository {
  async getSettings(): Promise<IPlatformSetting> {
    let settings = await PlatformSetting.findOne().exec();
    if (!settings) {
      settings = await PlatformSetting.create({});
    }
    return settings;
  }

  async updateSettings(updateData: Partial<IPlatformSetting>): Promise<IPlatformSetting> {
    let settings = await PlatformSetting.findOne().exec();
    if (!settings) {
      settings = await PlatformSetting.create(updateData);
    } else {
      settings = await PlatformSetting.findOneAndUpdate({}, updateData, { new: true }).exec();
    }
    return settings as IPlatformSetting;
  }
}

export const settingsRepository = new SettingsRepository();
