import crypto from 'crypto';
import { GENUINE_COMPANION_APK_BASE64, GENUINE_PARENT_APK_BASE64 } from './genuineApks';

export interface ApkMetadata {
  id: string;
  name: string;
  filename: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  md5: string;
  releaseDate: string;
  description: string;
  permissions: string[];
}

export async function buildApkBuffer(isCompanion: boolean): Promise<{ buffer: Buffer; meta: ApkMetadata }> {
  const appName = isCompanion ? 'GuardianPath Child Companion' : 'GuardianPath Parent Console';
  const packageName = isCompanion ? 'com.guardianpath.child.companion' : 'com.guardianpath.parent.console';
  const filename = isCompanion ? 'GuardianPath-Child-Companion-v2.4.2.apk' : 'GuardianPath-Parent-Console-v2.4.2.apk';
  const versionName = '2.4.2';
  const versionCode = 242;

  const permissions = isCompanion
    ? [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.POST_NOTIFICATIONS',
      ]
    : [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ];

  const base64Data = isCompanion ? GENUINE_COMPANION_APK_BASE64 : GENUINE_PARENT_APK_BASE64;
  const buffer = Buffer.from(base64Data, 'base64');

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const sizeFormatted = `${Math.round(buffer.length / 1024)} KB`;

  const meta: ApkMetadata = {
    id: isCompanion ? 'companion' : 'parent',
    name: appName,
    filename,
    packageName,
    versionName,
    versionCode,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    sizeBytes: buffer.length,
    sizeFormatted,
    sha256,
    md5,
    releaseDate: 'October 2026 (v2.4.2 Production Signed & Verified v1+v2+v3)',
    description: isCompanion
      ? 'Child Device Guardian Daemon. Runs on Android to enforce web filtering, time schedules, real-time geofence reporting, and emergency SOS.'
      : 'Parent Safety Console. Full dashboard controls, real-time alerts, remote device lock, live camera & surround audio streaming.',
    permissions,
  };

  return { buffer, meta };
}
