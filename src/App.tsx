/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KidProfile,
  GeofenceZone,
  SafetyAlert,
  ScreenTimeRequest,
  BlockedSiteRequest,
  LocationPoint,
  ViewMode,
  RouteMovementRecord,
  CallLog,
  SmsMessage,
  SurroundAudioSession,
  CameraSnapshot,
  VideoRecording,
  SocialAccountConfig,
  SocialActivityItem,
  ChildFileItem,
  UserAccountProfile,
} from './types';
import {
  INITIAL_KIDS,
  INITIAL_GEOFENCES,
  INITIAL_SCREEN_TIME_REQUESTS,
  INITIAL_BLOCKED_SITE_REQUESTS,
  INITIAL_ALERTS,
  LEO_LOCATION_HISTORY,
  INITIAL_ROUTE_MOVEMENT_RECORDS,
  INITIAL_CALL_LOGS,
  INITIAL_SMS_MESSAGES,
  INITIAL_SURROUND_AUDIO_SESSIONS,
  INITIAL_CAMERA_SNAPSHOTS,
  INITIAL_VIDEO_RECORDINGS,
  INITIAL_SOCIAL_ACCOUNTS,
  INITIAL_SOCIAL_ACTIVITIES,
  INITIAL_CHILD_FILES,
} from './data/mockData';
import { HeaderNavbar } from './components/HeaderNavbar';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildDeviceSimulator } from './components/ChildDeviceSimulator';
import { AiUrlScannerModal } from './components/AiUrlScannerModal';
import { AiScreenTimeCoachModal } from './components/AiScreenTimeCoachModal';
import { AiDigestModal } from './components/AiDigestModal';
import { AddGeofenceModal } from './components/AddGeofenceModal';
import { AddChildModal } from './components/AddChildModal';
import { CameraAccessModal } from './components/CameraAccessModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Plus, UserPlus, Smartphone, Download } from 'lucide-react';

export default function App() {
  // Load state from localStorage or initial mock data
  const [kids, setKids] = useState<KidProfile[]>(() => {
    const saved = localStorage.getItem('kg_kids');
    return saved ? JSON.parse(saved) : INITIAL_KIDS;
  });

  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => {
    const saved = localStorage.getItem('kg_geofences');
    return saved ? JSON.parse(saved) : INITIAL_GEOFENCES;
  });

  const [alerts, setAlerts] = useState<SafetyAlert[]>(() => {
    const saved = localStorage.getItem('kg_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [pendingRequests, setPendingRequests] = useState<ScreenTimeRequest[]>(() => {
    const saved = localStorage.getItem('kg_pending_requests');
    return saved ? JSON.parse(saved) : INITIAL_SCREEN_TIME_REQUESTS;
  });

  const [pendingSiteRequests, setPendingSiteRequests] = useState<BlockedSiteRequest[]>(() => {
    const saved = localStorage.getItem('kg_pending_site_requests');
    return saved ? JSON.parse(saved) : INITIAL_BLOCKED_SITE_REQUESTS;
  });

  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>(LEO_LOCATION_HISTORY);

  const [routeHistoryRecords, setRouteHistoryRecords] = useState<RouteMovementRecord[]>(() => {
    const saved = localStorage.getItem('kg_route_history');
    return saved ? JSON.parse(saved) : INITIAL_ROUTE_MOVEMENT_RECORDS;
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('kg_call_logs');
    return saved ? JSON.parse(saved) : INITIAL_CALL_LOGS;
  });

  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(() => {
    const saved = localStorage.getItem('kg_sms_messages');
    return saved ? JSON.parse(saved) : INITIAL_SMS_MESSAGES;
  });

  const [audioSessions, setAudioSessions] = useState<SurroundAudioSession[]>(() => {
    const saved = localStorage.getItem('kg_audio_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SURROUND_AUDIO_SESSIONS;
  });

  const [snapshots, setSnapshots] = useState<CameraSnapshot[]>(() => {
    const saved = localStorage.getItem('kg_camera_snapshots');
    return saved ? JSON.parse(saved) : INITIAL_CAMERA_SNAPSHOTS;
  });

  const [videoRecordings, setVideoRecordings] = useState<VideoRecording[]>(() => {
    const saved = localStorage.getItem('kg_video_recordings');
    return saved ? JSON.parse(saved) : INITIAL_VIDEO_RECORDINGS;
  });

  const [socialAccounts, setSocialAccounts] = useState<SocialAccountConfig[]>(() => {
    const saved = localStorage.getItem('kg_social_accounts');
    return saved ? JSON.parse(saved) : INITIAL_SOCIAL_ACCOUNTS;
  });

  const [socialActivities, setSocialActivities] = useState<SocialActivityItem[]>(() => {
    const saved = localStorage.getItem('kg_social_activities');
    return saved ? JSON.parse(saved) : INITIAL_SOCIAL_ACTIVITIES;
  });

  const [childFiles, setChildFiles] = useState<ChildFileItem[]>(() => {
    const saved = localStorage.getItem('kg_child_files');
    return saved ? JSON.parse(saved) : INITIAL_CHILD_FILES;
  });

  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kg_user_profile');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('setup') || params.has('onboarding')) return true;
      const completed = localStorage.getItem('kg_onboarding_completed');
      return completed !== 'true';
    }
    return true;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('kg_device_role') as ViewMode | null;
      if (savedRole === 'child' || savedRole === 'parent') return savedRole;
    }
    return 'parent';
  });

  const [selectedKidId, setSelectedKidId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlKid = params.get('kid');
      if (urlKid) return urlKid;
    }
    return 'leo';
  });

  // Simulation & GPS State
  const [isSimulating, setIsSimulating] = useState(false);
  const [usingRealLocation, setUsingRealLocation] = useState(false);
  const [activeSosAlert, setActiveSosAlert] = useState<SafetyAlert | null>(null);

  // Modals
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [isAiDigestOpen, setIsAiDigestOpen] = useState(false);
  const [isAddGeofenceOpen, setIsAddGeofenceOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('install') || params.has('apk') || params.has('download');
    }
    return false;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('kg_kids', JSON.stringify(kids));
  }, [kids]);

  useEffect(() => {
    localStorage.setItem('kg_geofences', JSON.stringify(geofences));
  }, [geofences]);

  useEffect(() => {
    localStorage.setItem('kg_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('kg_pending_requests', JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  useEffect(() => {
    localStorage.setItem('kg_pending_site_requests', JSON.stringify(pendingSiteRequests));
  }, [pendingSiteRequests]);

  useEffect(() => {
    localStorage.setItem('kg_route_history', JSON.stringify(routeHistoryRecords));
  }, [routeHistoryRecords]);

  useEffect(() => {
    localStorage.setItem('kg_call_logs', JSON.stringify(callLogs));
  }, [callLogs]);

  useEffect(() => {
    localStorage.setItem('kg_sms_messages', JSON.stringify(smsMessages));
  }, [smsMessages]);

  useEffect(() => {
    localStorage.setItem('kg_audio_sessions', JSON.stringify(audioSessions));
  }, [audioSessions]);

  useEffect(() => {
    localStorage.setItem('kg_social_accounts', JSON.stringify(socialAccounts));
  }, [socialAccounts]);

  useEffect(() => {
    localStorage.setItem('kg_social_activities', JSON.stringify(socialActivities));
  }, [socialActivities]);

  useEffect(() => {
    localStorage.setItem('kg_child_files', JSON.stringify(childFiles));
  }, [childFiles]);

  useEffect(() => {
    localStorage.setItem('kg_camera_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem('kg_video_recordings', JSON.stringify(videoRecordings));
  }, [videoRecordings]);

  const handleTakeSnapshot = (newSnapshot: CameraSnapshot) => {
    setSnapshots((prev) => [newSnapshot, ...prev]);
    // Also create safety alert for parent
    const newAlert: SafetyAlert = {
      id: `alert-cam-${Date.now()}`,
      kidId: newSnapshot.kidId,
      kidName: kids.find((k) => k.id === newSnapshot.kidId)?.name || 'Child',
      severity: 'info',
      title: 'New Remote Camera Snapshot Recorded',
      description: `Camera snapshot captured: "${newSnapshot.caption}" at ${newSnapshot.locationAddress}. AI Safety Index: ${newSnapshot.aiSafetyAnalysis.safetyScore}%`,
      timestamp: 'Just now',
      read: false,
      category: 'system',
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveVideoRecording = (newRecording: VideoRecording) => {
    setVideoRecordings((prev) => [newRecording, ...prev]);
    const newAlert: SafetyAlert = {
      id: `alert-vid-${Date.now()}`,
      kidId: newRecording.kidId,
      kidName: kids.find((k) => k.id === newRecording.kidId)?.name || 'Child',
      severity: 'info',
      title: 'New Video Clip Recorded',
      description: `Video recording saved (${newRecording.durationSeconds}s): "${newRecording.caption}" at ${newRecording.locationAddress}. AI Safety Index: ${newRecording.aiSafetyAnalysis.safetyScore}%`,
      timestamp: 'Just now',
      read: false,
      category: 'system',
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteVideoRecording = (id: string) => {
    setVideoRecordings((prev) => prev.filter((v) => v.id !== id));
  };

  // Movement Simulation interval & Continuous Route Recording
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const todayStr = new Date().toISOString().split('T')[0];

      setKids((prevKids) =>
        prevKids.map((k) => {
          // Add tiny random jitter to lat/lng to simulate walking/transit
          const dLat = (Math.random() - 0.5) * 0.001;
          const dLng = (Math.random() - 0.5) * 0.001;
          const newLat = k.currentLocation.lat + dLat;
          const newLng = k.currentLocation.lng + dLng;
          const distDelta = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough km
          const speed = Number((distDelta * 1400 + Math.random() * 3).toFixed(1));
          const activity = speed > 15 ? 'driving' : speed > 1.5 ? 'walking' : 'stationary';

          // Automatically record movement entry to route history log
          const newRecord: RouteMovementRecord = {
            id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kidId: k.id,
            timestamp: nowStr,
            date: todayStr,
            lat: newLat,
            lng: newLng,
            speedKmH: speed,
            locationName: `Live Movement near ${k.currentLocation.address.split(',')[0]}`,
            activity: activity as any,
            batteryLevel: k.batteryLevel,
            accuracyMeters: Math.floor(3 + Math.random() * 4),
          };

          setRouteHistoryRecords((prevRecs) => [newRecord, ...prevRecs].slice(0, 100));

          // Also update brief location timeline history for selected kid
          if (k.id === selectedKidId) {
            setLocationHistory((prevLocs) => [
              {
                time: nowStr,
                locationName: `En Route near ${k.currentLocation.address.split(',')[0]}`,
                lat: newLat,
                lng: newLng,
                activity: `Recorded ${activity} at ${speed} km/h`,
              },
              ...prevLocs.slice(0, 10),
            ]);
          }

          return {
            ...k,
            currentLocation: {
              ...k.currentLocation,
              lat: newLat,
              lng: newLng,
              lastUpdated: 'Just now (Live REC)',
            },
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedKidId]);

  // Real Browser Geolocation helper
  const handleUseRealLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUsingRealLocation(true);
        setKids((prevKids) =>
          prevKids.map((k) =>
            k.id === selectedKidId
              ? {
                  ...k,
                  currentLocation: {
                    ...k.currentLocation,
                    lat: latitude,
                    lng: longitude,
                    address: `Live Device Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                    lastUpdated: 'Just now via browser GPS',
                  },
                }
              : k
          )
        );
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not access GPS location. Please check browser permissions.');
      }
    );
  };

  // Quick Action Toggles
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  const handleToggleKidLock = (kidId: string) => {
    setKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, isDeviceLocked: !k.isDeviceLocked } : k))
    );
  };

  const handleToggleKidInternet = (kidId: string) => {
    setKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, isInternetPaused: !k.isInternetPaused } : k))
    );
  };

  const allLocked = kids.every((k) => k.isDeviceLocked);
  const allPaused = kids.every((k) => k.isInternetPaused);

  const handleToggleAllLock = () => {
    const nextState = !allLocked;
    setKids((prev) => prev.map((k) => ({ ...k, isDeviceLocked: nextState })));
  };

  const handleToggleAllInternet = () => {
    const nextState = !allPaused;
    setKids((prev) => prev.map((k) => ({ ...k, isInternetPaused: nextState })));
  };

  const handleUpdateCategoryLimit = (kidId: string, category: string, newLimitMinutes: number) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const updatedCats = k.screenTime.categories.map((c) =>
          c.category === category ? { ...c, limitMinutes: newLimitMinutes } : c
        );
        const newTotalLimit = updatedCats.reduce((acc, c) => acc + c.limitMinutes, 0);
        return {
          ...k,
          screenTime: {
            ...k.screenTime,
            dailyLimitMinutes: newTotalLimit,
            categories: updatedCats,
          },
        };
      })
    );
  };

  const handleApplyRecommendedLimits = (kidId: string, totalLimitMinutes: number, categoryBreakdown: any[]) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const updatedCats = k.screenTime.categories.map((c) => {
          const match = categoryBreakdown.find((b: any) => b.category.toLowerCase().includes(c.category.toLowerCase()));
          return match ? { ...c, limitMinutes: match.limitMinutes } : c;
        });
        return {
          ...k,
          screenTime: {
            ...k.screenTime,
            dailyLimitMinutes: totalLimitMinutes,
            categories: updatedCats,
          },
        };
      })
    );
  };

  const handleToggleContentFilter = (kidId: string, filterId: string) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const updatedCats = k.contentFilters.blockedCategories.map((c) =>
          c.id === filterId ? { ...c, isBlocked: !c.isBlocked } : c
        );
        return {
          ...k,
          contentFilters: {
            ...k.contentFilters,
            blockedCategories: updatedCats,
          },
        };
      })
    );
  };

  const handleToggleAppStatus = (kidId: string, appId: string, newStatus: 'allowed' | 'time_limited' | 'blocked') => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const updatedApps = k.installedApps.map((a) => (a.id === appId ? { ...a, status: newStatus } : a));
        return {
          ...k,
          installedApps: updatedApps,
        };
      })
    );
  };

  // Screen time & site request handlers
  const handleRequestExtraTime = (request: Omit<ScreenTimeRequest, 'id' | 'timestamp' | 'status'>) => {
    const newReq: ScreenTimeRequest = {
      ...request,
      id: 'req-' + Date.now(),
      timestamp: 'Just now',
      status: 'pending',
    };
    setPendingRequests((prev) => [newReq, ...prev]);
  };

  const handleRequestBlockedSite = (request: Omit<BlockedSiteRequest, 'id' | 'timestamp' | 'status'>) => {
    const newReq: BlockedSiteRequest = {
      ...request,
      id: 'site-req-' + Date.now(),
      timestamp: 'Just now',
      status: 'pending',
    };
    setPendingSiteRequests((prev) => [newReq, ...prev]);
  };

  const handleApproveScreenTimeRequest = (requestId: string, approvedMinutes: number) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (req) {
      setKids((prev) =>
        prev.map((k) =>
          k.id === req.kidId
            ? {
                ...k,
                screenTime: {
                  ...k.screenTime,
                  dailyLimitMinutes: k.screenTime.dailyLimitMinutes + approvedMinutes,
                },
              }
            : k
        )
      );
    }
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleDeclineScreenTimeRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleApproveSiteRequest = (requestId: string) => {
    const req = pendingSiteRequests.find((r) => r.id === requestId);
    if (req) {
      const domain = req.url.replace(/https?:\/\//, '').split('/')[0];
      setKids((prev) =>
        prev.map((k) =>
          k.id === req.kidId
            ? {
                ...k,
                contentFilters: {
                  ...k.contentFilters,
                  customAllowedWebsites: [...k.contentFilters.customAllowedWebsites, domain],
                  customBlockedWebsites: k.contentFilters.customBlockedWebsites.filter((d) => !domain.includes(d)),
                },
              }
            : k
        )
      );
    }
    setPendingSiteRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleToggleStealthMode = (
    kidId: string,
    enabled?: boolean,
    appName?: 'System Settings' | 'Device Helper' | 'Battery Optimizer'
  ) => {
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== kidId) return k;
        const nextEnabled = enabled !== undefined ? enabled : !(k.isStealthModeEnabled ?? true);
        const nextName = appName || k.stealthAppName || 'Device Helper';
        return {
          ...k,
          isStealthModeEnabled: nextEnabled,
          stealthAppName: nextName,
        };
      })
    );
  };

  const handleSimulateCall = (
    kidId: string,
    contactName: string,
    phoneNumber: string,
    type: 'incoming' | 'outgoing' | 'blocked'
  ) => {
    const kid = kids.find((k) => k.id === kidId);
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isFlagged = type === 'blocked' || contactName.toLowerCase().includes('unknown');
    const newCall: CallLog = {
      id: `call-${Date.now()}`,
      kidId: kidId as any,
      contactName,
      phoneNumber,
      type,
      timestamp: nowStr,
      durationSeconds: type === 'blocked' ? 0 : Math.floor(15 + Math.random() * 120),
      isFlagged,
      flagReason: isFlagged ? 'Unregistered contact or suspicious telemarketer' : undefined,
      audioRecordingAvailable: type !== 'blocked',
    };
    setCallLogs((prev) => [newCall, ...prev]);

    if (isFlagged) {
      const newAlert: SafetyAlert = {
        id: `alert-call-${Date.now()}`,
        kidId: kidId as any,
        kidName: kid ? kid.name : 'Child',
        severity: 'warning',
        title: `Suspicious ${type.toUpperCase()} Call Alert`,
        description: `Call detected from ${contactName} (${phoneNumber}). Flagged for parent review.`,
        timestamp: nowStr,
        read: false,
        category: 'system',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const handleSimulateSms = (
    kidId: string,
    contactName: string,
    phoneNumber: string,
    messageText: string,
    riskCategory: any
  ) => {
    const kid = kids.find((k) => k.id === kidId);
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isFlagged = riskCategory !== 'safe';
    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      kidId: kidId as any,
      contactName,
      phoneNumber,
      type: 'received',
      messageText,
      timestamp: nowStr,
      isFlagged,
      riskCategory,
      sentiment: isFlagged ? 'hostile' : 'positive',
    };
    setSmsMessages((prev) => [newSms, ...prev]);

    if (isFlagged) {
      const newAlert: SafetyAlert = {
        id: `alert-sms-${Date.now()}`,
        kidId: kidId as any,
        kidName: kid ? kid.name : 'Child',
        severity: 'critical',
        title: `Flagged SMS Content: ${String(riskCategory).toUpperCase()}`,
        description: `Incoming message from ${contactName}: "${messageText}"`,
        timestamp: nowStr,
        read: false,
        category: 'content_filter',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const handleStartSurroundAudio = (kidId: string) => {
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const contexts = ['quiet_classroom', 'street_traffic', 'playground', 'home_conversation'] as const;
    const chosenContext = contexts[Math.floor(Math.random() * contexts.length)];
    const newAudio: SurroundAudioSession = {
      id: `audio-${Date.now()}`,
      kidId: kidId as any,
      timestamp: nowStr,
      durationSeconds: 30,
      noiseLevelDb: Math.floor(40 + Math.random() * 35),
      ambientContext: chosenContext,
      isLive: false,
      audioWaveform: [25, 40, 65, 80, 45, 90, 70, 50, 30, 85, 40, 20, 30, 40, 15],
      detectedKeywords: ['ambient recording', chosenContext.replace('_', ' ')],
      status: 'completed',
    };
    setAudioSessions((prev) => [newAudio, ...prev]);
  };

  const handleUpdateSocialAccountStatus = (accountId: string, newStatus: SocialAccountConfig['status']) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, status: newStatus } : acc))
    );
  };

  const handleUpdateSocialAccountLimit = (accountId: string, newLimitMinutes: number) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, dailyLimitMinutes: newLimitMinutes } : acc))
    );
  };

  const handleToggleSocialAccountShield = (
    accountId: string,
    field: 'dmShieldEnabled' | 'safeModeEnforced' | 'nsfwShieldEnabled' | 'commentFilterEnabled'
  ) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, [field]: !acc[field] } : acc))
    );
  };

  const handlePauseAllSocial = (kidId: string) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.kidId === kidId ? { ...acc, status: 'paused' } : acc))
    );
    const kid = kids.find((k) => k.id === kidId);
    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newAlert: SafetyAlert = {
      id: `alert-social-pause-${Date.now()}`,
      kidId: kidId as any,
      kidName: kid ? kid.name : 'Child',
      severity: 'warning',
      title: 'Social Media Access Paused',
      description: 'Parent applied instant pause to all social networks for this device.',
      timestamp: nowStr,
      read: false,
      category: 'system',
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleTakeSocialParentAction = (
    activityId: string,
    action: 'blocked_contact' | 'warned_kid' | 'removed_content' | 'dismissed'
  ) => {
    setSocialActivities((prev) =>
      prev.map((act) => (act.id === activityId ? { ...act, parentActionTaken: action } : act))
    );
  };

  const handleAddSimulatedSocialActivity = (activity: Omit<SocialActivityItem, 'id'>) => {
    const newAct: SocialActivityItem = {
      ...activity,
      id: `act-${Date.now()}`,
    };
    setSocialActivities((prev) => [newAct, ...prev]);

    if (activity.isFlagged) {
      const kid = kids.find((k) => k.id === activity.kidId);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newAlert: SafetyAlert = {
        id: `alert-social-flag-${Date.now()}`,
        kidId: activity.kidId,
        kidName: kid ? kid.name : 'Child',
        severity: 'critical',
        title: `Flagged ${activity.platform.toUpperCase()} Risk: ${activity.riskCategory.replace('_', ' ').toUpperCase()}`,
        description: `Content from ${activity.senderOrAuthor}: "${activity.content.slice(0, 60)}..."`,
        timestamp: nowStr,
        read: false,
        category: 'content_filter',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const handleUpdateFileStatus = (fileId: string, status: ChildFileItem['status']) => {
    setChildFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status } : f))
    );
  };

  const handleUpdateFilePermission = (fileId: string, permission: ChildFileItem['parentPermission']) => {
    setChildFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, parentPermission: permission } : f))
    );
  };

  const handleDeleteFile = (fileId: string) => {
    setChildFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'deleted' } : f))
    );
  };

  const handleAddSimulatedFile = (file: Omit<ChildFileItem, 'id'>) => {
    const newFile: ChildFileItem = {
      ...file,
      id: `file-${Date.now()}`,
    };
    setChildFiles((prev) => [newFile, ...prev]);

    if (file.isFlagged) {
      const kid = kids.find((k) => k.id === file.kidId);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newAlert: SafetyAlert = {
        id: `alert-file-flag-${Date.now()}`,
        kidId: file.kidId,
        kidName: kid ? kid.name : 'Child',
        severity: file.riskLevel === 'malicious' ? 'critical' : 'warning',
        title: `Flagged File Detected: ${file.fileName}`,
        description: `AI File Shield flagged file as ${file.riskLevel.toUpperCase()} (${file.riskCategory}). ${file.aiScanSummary}`,
        timestamp: nowStr,
        read: false,
        category: 'security',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const handleDeclineSiteRequest = (requestId: string) => {
    setPendingSiteRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleAddCustomBlockedWebsite = (kidId: string, domain: string) => {
    setKids((prev) =>
      prev.map((k) =>
        k.id === kidId
          ? {
              ...k,
              contentFilters: {
                ...k.contentFilters,
                customBlockedWebsites: [...k.contentFilters.customBlockedWebsites, domain],
              },
            }
          : k
      )
    );
  };

  const handleRemoveCustomBlockedWebsite = (kidId: string, domain: string) => {
    setKids((prev) =>
      prev.map((k) =>
        k.id === kidId
          ? {
              ...k,
              contentFilters: {
                ...k.contentFilters,
                customBlockedWebsites: k.contentFilters.customBlockedWebsites.filter((d) => d !== domain),
              },
            }
          : k
      )
    );
  };

  const handleAddGeofence = (geofence: GeofenceZone) => {
    setGeofences((prev) => [...prev, geofence]);
  };

  const handleAddChild = (kid: KidProfile) => {
    setKids((prev) => [...prev, kid]);
    setSelectedKidId(kid.id);
  };

  const handleTriggerSos = (kidId: string, kidName: string) => {
    const newAlert: SafetyAlert = {
      id: 'sos-' + Date.now(),
      kidId: kidId as any,
      kidName,
      severity: 'critical',
      title: 'EMERGENCY SOS BUTTON PRESSED',
      description: `${kidName} pressed the emergency SOS button on their companion device!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      category: 'sos',
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveSosAlert(newAlert);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <HeaderNavbar
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        kids={kids}
        alerts={alerts}
        userProfile={userProfile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAiDigest={() => setIsAiDigestOpen(true)}
        onOpenAiCoach={() => setIsAiCoachOpen(true)}
        onOpenLiveCamera={() => setIsCameraModalOpen(true)}
        onOpenApkDownload={() => setIsApkModalOpen(true)}
        onToggleAllLock={handleToggleAllLock}
        onToggleAllInternet={handleToggleAllInternet}
        allLocked={allLocked}
        allPaused={allPaused}
        activeSosAlert={activeSosAlert}
        onDismissSos={() => setActiveSosAlert(null)}
      />

      {/* 1-Tap Android WebAPK Installation Banner (Fixes Parsing Problem) */}
      <PWAInstallBanner onOpenApkModal={() => setIsApkModalOpen(true)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: PARENT DASHBOARD */}
        {viewMode === 'parent' ? (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Parental Control Hub</h2>
                <p className="text-xs text-slate-400">Manage digital health, location safety, and content rules</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsApkModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-600/30 to-indigo-600/30 hover:from-emerald-600/40 hover:to-indigo-600/40 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
                  title="Download Android APK & Pair Phone"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download APK & Pair</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1 rounded font-mono">v2.4.2 Signed</span>
                </button>
                <button
                  onClick={() => setIsAddChildOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>+ Add Child</span>
                </button>
              </div>
            </div>

            <ParentDashboard
              kids={kids}
              selectedKidId={selectedKidId}
              onSelectKid={setSelectedKidId}
              geofences={geofences}
              alerts={alerts}
              pendingRequests={pendingRequests}
              pendingSiteRequests={pendingSiteRequests}
              locationHistory={locationHistory}
              onToggleKidLock={handleToggleKidLock}
              onToggleKidInternet={handleToggleKidInternet}
              onUpdateCategoryLimit={handleUpdateCategoryLimit}
              onToggleContentFilter={handleToggleContentFilter}
              onToggleAppStatus={handleToggleAppStatus}
              onApproveScreenTimeRequest={handleApproveScreenTimeRequest}
              onDeclineScreenTimeRequest={handleDeclineScreenTimeRequest}
              onApproveSiteRequest={handleApproveSiteRequest}
              onDeclineSiteRequest={handleDeclineSiteRequest}
              onAddCustomBlockedWebsite={handleAddCustomBlockedWebsite}
              onRemoveCustomBlockedWebsite={handleRemoveCustomBlockedWebsite}
              onAddGeofenceClick={() => setIsAddGeofenceOpen(true)}
              onOpenAiScanner={() => setIsAiScannerOpen(true)}
              onOpenAiCoach={() => setIsAiCoachOpen(true)}
              onOpenAiDigest={() => setIsAiDigestOpen(true)}
              onOpenLiveCamera={() => setIsCameraModalOpen(true)}
              isSimulating={isSimulating}
              onToggleSimulation={() => setIsSimulating(!isSimulating)}
              onUseRealLocation={handleUseRealLocation}
              usingRealLocation={usingRealLocation}
              routeMovementRecords={routeHistoryRecords}
              onToggleStealthMode={handleToggleStealthMode}
              callLogs={callLogs}
              smsMessages={smsMessages}
              audioSessions={audioSessions}
              onSimulateCall={handleSimulateCall}
              onSimulateSms={handleSimulateSms}
              onStartSurroundAudio={handleStartSurroundAudio}
              socialAccounts={socialAccounts}
              socialActivities={socialActivities}
              onUpdateSocialAccountStatus={handleUpdateSocialAccountStatus}
              onUpdateSocialAccountLimit={handleUpdateSocialAccountLimit}
              onToggleSocialAccountShield={handleToggleSocialAccountShield}
              onPauseAllSocial={handlePauseAllSocial}
              onTakeSocialParentAction={handleTakeSocialParentAction}
              onAddSimulatedSocialActivity={handleAddSimulatedSocialActivity}
              files={childFiles}
              onUpdateFileStatus={handleUpdateFileStatus}
              onUpdateFilePermission={handleUpdateFilePermission}
              onDeleteFile={handleDeleteFile}
              onAddSimulatedFile={handleAddSimulatedFile}
              onOpenApkDownload={() => setIsApkModalOpen(true)}
            />
          </div>
        ) : (
          /* VIEW 2: CHILD DEVICE COMPANION SIMULATOR */
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Child Companion Device View</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Test how your child experiences screen limits, blocked websites, app restrictions, and extra time requests in real time!
              </p>
            </div>

            <ChildDeviceSimulator
              kids={kids}
              selectedKidId={selectedKidId}
              onSelectKid={setSelectedKidId}
              onRequestExtraTime={handleRequestExtraTime}
              onRequestBlockedSite={handleRequestBlockedSite}
              onTriggerSos={handleTriggerSos}
              pendingRequests={pendingRequests}
              pendingSiteRequests={pendingSiteRequests}
              onToggleStealthMode={handleToggleStealthMode}
              onOpenLiveCamera={() => setIsCameraModalOpen(true)}
              onOpenApkDownload={() => setIsApkModalOpen(true)}
              files={childFiles}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <CameraAccessModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        kids={kids}
        selectedKidId={selectedKidId}
        onSelectKid={setSelectedKidId}
        snapshots={snapshots}
        onTakeSnapshot={handleTakeSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        videoRecordings={videoRecordings}
        onSaveVideoRecording={handleSaveVideoRecording}
        onDeleteVideoRecording={handleDeleteVideoRecording}
      />
      <AiUrlScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        kidAge={selectedKid.age}
        onAddCustomBlockRule={(domain) => handleAddCustomBlockedWebsite(selectedKid.id, domain)}
        onAddCustomAllowRule={(domain) => {
          setKids((prev) =>
            prev.map((k) =>
              k.id === selectedKid.id
                ? {
                    ...k,
                    contentFilters: {
                      ...k.contentFilters,
                      customAllowedWebsites: [...k.contentFilters.customAllowedWebsites, domain],
                    },
                  }
                : k
            )
          );
        }}
      />

      <AiScreenTimeCoachModal
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
        kid={selectedKid}
        onApplyRecommendedLimits={handleApplyRecommendedLimits}
      />

      <AiDigestModal
        isOpen={isAiDigestOpen}
        onClose={() => setIsAiDigestOpen(false)}
        kid={selectedKid}
        alerts={alerts}
      />

      <AddGeofenceModal
        isOpen={isAddGeofenceOpen}
        onClose={() => setIsAddGeofenceOpen(false)}
        onAddGeofence={handleAddGeofence}
      />

      <AddChildModal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        onAddChild={handleAddChild}
      />

      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        kids={kids}
        selectedKidId={selectedKidId}
      />

      {/* First-Run Onboarding & Access Grant Flow */}
      {isOnboardingOpen && (
        <OnboardingFlow
          onComplete={(profile) => {
            setUserProfile(profile);
            setIsOnboardingOpen(false);
            setViewMode(profile.deviceRole);
          }}
          onCancel={userProfile ? () => setIsOnboardingOpen(false) : undefined}
          initialRole={userProfile?.deviceRole || viewMode}
        />
      )}

      {/* System Bar Footer */}
      <footer className="h-10 border-t border-slate-800 bg-slate-950 px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-tighter font-mono mt-8">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>STATUS: SECURED & MONITORING</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">ENCRYPTION: AES-256</span>
          <span className="text-indigo-400 font-bold">LAST SYNC: JUST NOW</span>
        </div>
      </footer>
    </div>
  );
}
