export type ViewMode = 'parent' | 'child';

export type KidId = 'leo' | 'maya';

export interface KidProfile {
  id: KidId;
  name: string;
  age: number;
  avatar: string;
  deviceModel: string;
  batteryLevel: number;
  isOnline: boolean;
  isDeviceLocked: boolean;
  isInternetPaused: boolean;
  isStealthModeEnabled?: boolean;
  stealthAppName?: 'System Settings' | 'Device Helper' | 'Battery Optimizer';
  currentLocation: {
    address: string;
    lat: number;
    lng: number;
    status: 'at_school' | 'at_home' | 'at_park' | 'in_transit';
    lastUpdated: string;
  };
  screenTime: {
    usedMinutes: number;
    dailyLimitMinutes: number;
    categories: {
      category: string;
      usedMinutes: number;
      limitMinutes: number;
      iconName: string;
      color: string;
    }[];
  };
  schedules: DowntimeSchedule[];
  contentFilters: ContentFilterSettings;
  installedApps: AppPermission[];
}

export interface DowntimeSchedule {
  id: string;
  name: string;
  startTime: string; // e.g., "20:30"
  endTime: string;   // e.g., "07:00"
  days: string[];    // ["Mon", "Tue", "Wed", "Thu", "Fri"]
  isActive: boolean;
  type: 'bedtime' | 'school' | 'homework' | 'custom';
}

export interface ContentFilterSettings {
  strictnessLevel: 'strict' | 'moderate' | 'custom';
  safeSearchEnforced: boolean;
  youtubeRestrictedMode: boolean;
  blockedCategories: {
    id: string;
    name: string;
    description: string;
    isBlocked: boolean;
  }[];
  customBlockedWebsites: string[];
  customAllowedWebsites: string[];
}

export interface AppPermission {
  id: string;
  name: string;
  icon: string;
  category: 'social' | 'games' | 'education' | 'entertainment' | 'utility';
  status: 'allowed' | 'time_limited' | 'blocked';
  dailyLimitMinutes?: number;
  usedMinutesToday: number;
}

export interface ScreenTimeRequest {
  id: string;
  kidId: KidId;
  kidName: string;
  requestMinutes: number;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'declined';
  appName?: string;
}

export interface BlockedSiteRequest {
  id: string;
  kidId: KidId;
  kidName: string;
  url: string;
  siteName: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'declined';
  category: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'home' | 'school' | 'park' | 'relatives' | 'custom';
  lat: number;
  lng: number;
  radiusMeters: number;
  notifyOnArrival: boolean;
  notifyOnDeparture: boolean;
  assignedKidIds: KidId[];
}

export interface SafetyAlert {
  id: string;
  kidId: KidId;
  kidName: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  category: 'location' | 'screen_time' | 'content_filter' | 'sos' | 'system' | 'security';
  locationCoordinates?: { lat: number; lng: number };
}

export interface LocationPoint {
  time: string;
  locationName: string;
  lat: number;
  lng: number;
  activity: string;
}

export interface RouteMovementRecord {
  id: string;
  kidId: KidId;
  timestamp: string;
  date: string;
  lat: number;
  lng: number;
  speedKmH: number;
  locationName: string;
  activity: 'walking' | 'driving' | 'stationary' | 'cycling';
  batteryLevel: number;
  accuracyMeters: number;
}

export interface AiUrlAnalysisResult {
  url: string;
  domain: string;
  safetyScore: number; // 0 to 100
  rating: 'Safe' | 'Caution' | 'Unsafe';
  ageRating: string; // e.g., "7+", "13+", "18+"
  categories: string[];
  summary: string;
  recommendedAction: 'allow' | 'block' | 'time_limit';
  reasons: string[];
}

export interface AiSafetyDigestReport {
  overallSafetyRating: 'Excellent' | 'Good' | 'Attention Needed';
  wellnessScore: number; // 0-100
  summary: string;
  highlights: string[];
  riskFactors: string[];
  screenTimeAdvice: string;
  recommendedSchedules: string[];
}

export interface CallLog {
  id: string;
  kidId: KidId;
  contactName: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'blocked';
  timestamp: string;
  durationSeconds: number;
  isFlagged: boolean;
  flagReason?: string;
  audioRecordingAvailable?: boolean;
}

export interface SmsMessage {
  id: string;
  kidId: KidId;
  contactName: string;
  phoneNumber: string;
  type: 'received' | 'sent';
  messageText: string;
  timestamp: string;
  isFlagged: boolean;
  riskCategory?: 'cyberbullying' | 'stranger_danger' | 'adult_content' | 'spam' | 'safe';
  sentiment?: 'positive' | 'neutral' | 'suspicious' | 'hostile';
}

export interface SurroundAudioSession {
  id: string;
  kidId: KidId;
  timestamp: string;
  durationSeconds: number;
  noiseLevelDb: number;
  ambientContext: 'quiet_classroom' | 'street_traffic' | 'playground' | 'home_conversation' | 'loud_event';
  isLive: boolean;
  audioWaveform: number[];
  detectedKeywords?: string[];
  status: 'recording' | 'completed' | 'scheduled';
}

export interface CameraSnapshot {
  id: string;
  kidId: KidId;
  timestamp: string;
  imageUrl: string;
  caption: string;
  locationAddress: string;
  facingMode: 'user' | 'environment';
  triggerType: 'remote_parent_request' | 'geofence_arrival' | 'sos_trigger' | 'child_checkin';
  aiSafetyAnalysis: {
    safetyScore: number;
    detectedObjects: string[];
    lightingQuality: 'good' | 'low_light' | 'overexposed';
    contextNote: string;
    flaggedContent: boolean;
  };
}

export interface VideoRecording {
  id: string;
  kidId: KidId;
  timestamp: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  caption: string;
  locationAddress: string;
  facingMode: 'user' | 'environment';
  triggerType: 'remote_parent_request' | 'geofence_arrival' | 'sos_trigger' | 'scheduled_safety_check';
  aiSafetyAnalysis: {
    safetyScore: number;
    detectedObjects: string[];
    lightingQuality: 'good' | 'low_light' | 'overexposed';
    contextNote: string;
    flaggedContent: boolean;
  };
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'snapchat' | 'youtube' | 'discord' | 'roblox' | 'whatsapp';

export interface SocialAccountConfig {
  id: string;
  kidId: KidId;
  platform: SocialPlatform;
  platformName: string;
  handle: string;
  status: 'active' | 'paused' | 'blocked' | 'restricted';
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  dmShieldEnabled: boolean;
  safeModeEnforced: boolean;
  nsfwShieldEnabled: boolean;
  commentFilterEnabled: boolean;
  unreadAlertCount: number;
}

export interface SocialActivityItem {
  id: string;
  kidId: KidId;
  platform: SocialPlatform;
  type: 'post' | 'direct_message' | 'comment' | 'video_upload' | 'friend_request';
  senderOrAuthor: string;
  senderAvatar?: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  isFlagged: boolean;
  riskCategory: 'cyberbullying' | 'stranger_danger' | 'adult_content' | 'self_harm' | 'hate_speech' | 'safe';
  sentiment: 'positive' | 'neutral' | 'suspicious' | 'toxic';
  aiSafetyScore: number;
  parentActionTaken?: 'none' | 'blocked_contact' | 'warned_kid' | 'removed_content' | 'dismissed';
  aiContextAdvice: string;
}

export type FileCategory = 'photos' | 'videos' | 'documents' | 'downloads' | 'audio' | 'executables';

export interface ChildFileItem {
  id: string;
  kidId: KidId;
  fileName: string;
  category: FileCategory;
  fileSizeMb: number;
  mimeType: string;
  filePath: string;
  modifiedTimestamp: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  isFlagged: boolean;
  riskLevel: 'safe' | 'suspicious' | 'restricted' | 'malicious';
  riskCategory: 'nsfw_media' | 'homework_doc' | 'cheat_sheet' | 'unverified_apk' | 'personal_photo' | 'audio_memo' | 'safe';
  status: 'normal' | 'quarantined' | 'deleted' | 'hidden';
  parentPermission: 'allowed' | 'restricted' | 'blocked';
  aiScanSummary: string;
  detectedTextSnippet?: string;
}
export type AuthMethod = 'phone' | 'email';

export type DeviceRole = 'parent' | 'child';

export type PermissionStatus = 'pending' | 'granting' | 'granted' | 'denied';

export interface DevicePermissions {
  location: PermissionStatus;
  notifications: PermissionStatus;
  microphone: PermissionStatus;
  camera: PermissionStatus;
  deviceAdmin: PermissionStatus;
}

export interface UserAccountProfile {
  name: string;
  authMethod: AuthMethod;
  identifier: string; // phone number or email address
  countryCode?: string;
  deviceRole: DeviceRole;
  pairingCode?: string;
  isVerified: boolean;
  createdAt: string;
  permissionsGranted: DevicePermissions;
}

