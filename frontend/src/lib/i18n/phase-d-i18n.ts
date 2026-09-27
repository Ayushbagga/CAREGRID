/**
 * CAREGRID Phase D Trilingual Dictionary (Marathi, Hindi, English)
 * Ensures 100% key parity across all supported rural languages.
 */

export interface PhaseDTranslations {
  // Realtime & Sync
  syncStateOffline: string;
  syncStateSyncing: string;
  syncStateSynced: string;
  syncStateFailed: string;
  retryAllBtn: string;
  retryItemBtn: string;
  failedItemsTitle: string;
  noFailedItems: string;
  unresolvedSyncLabel: string;
  lastSyncLabel: string;
  realtimeConnected: string;
  realtimeDisconnected: string;
  realtimeFallback: string;

  // Notification Center
  notificationsTitle: string;
  noNotifications: string;
  markAllRead: string;
  clearNotifications: string;
  newUrgentCaseAlert: string;
  referralUpdateAlert: string;
  followUpOverdueAlert: string;
  syncFailureAlert: string;
  systemEventAlert: string;
  viewDetailsBtn: string;

  // ASHA UX
  quickPresetsTitle: string;
  normalAdultPreset: string;
  normalAntenatalPreset: string;
  quickVitalsHelper: string;
  searchPatientPlaceholder: string;
  oneTapFollowUpBtn: string;
  quickVitalsBtn: string;
  highRiskPregnancyAlert: string;
  criticalUrgencyAlert: string;
  bpStepperLabel: string;
  hrStepperLabel: string;
  spo2StepperLabel: string;

  // Command Center Live
  liveUrgentQueue: string;
  recentEventsTitle: string;
  noRecentEvents: string;
  queueStatusRealtime: string;

  // Voice Assistant
  voiceInputTitle: string;
  voiceListening: string;
  voiceStartListening: string;
  voiceStopListening: string;
  voiceSpeakSummary: string;
  voiceStopSpeaking: string;
  voiceNotSupported: string;
  voicePermissionDenied: string;
  voiceError: string;
}

export const phaseDMarathi: PhaseDTranslations = {
  syncStateOffline: 'ऑफलाइन (स्थानिक डेटा सुरक्षित)',
  syncStateSyncing: 'डेटा क्लाउडवर समक्रमित होत आहे...',
  syncStateSynced: 'सर्व डेटा समक्रमित झाला आहे',
  syncStateFailed: 'समक्रमण अयशस्वी (पुन्हा प्रयत्न करा)',
  retryAllBtn: 'सर्व पुन्हा समक्रमित करा',
  retryItemBtn: 'पुन्हा प्रयत्न करा',
  failedItemsTitle: 'अयशस्वी नोंदी',
  noFailedItems: 'कोणत्याही नोंदी अयशस्वी नाहीत',
  unresolvedSyncLabel: 'प्रलंबित नोंदी',
  lastSyncLabel: 'शेवटचे समक्रमण',
  realtimeConnected: 'थेट नेटवर्क जोडलेले',
  realtimeDisconnected: 'थेट नेटवर्क खंडित',
  realtimeFallback: 'नियमित पडताळणी सुरू',

  notificationsTitle: 'सूचना केंद्र',
  noNotifications: 'कोणत्याही नवीन सूचना नाहीत',
  markAllRead: 'सर्व वाचल्याचे चिन्हांकित करा',
  clearNotifications: 'सूचना साफ करा',
  newUrgentCaseAlert: 'नवीन तातडीची केस आढळली',
  referralUpdateAlert: 'रेफरल स्थितीत बदल',
  followUpOverdueAlert: 'आशा गृहभेट थकीत',
  syncFailureAlert: 'ऑफलाइन समक्रमण अडचण',
  systemEventAlert: 'महत्त्वाची सिस्टीम नोंद',
  viewDetailsBtn: 'तपशील पहा',

  quickPresetsTitle: 'जलद नोंदी (एका क्लिकवर)',
  normalAdultPreset: 'सामान्य प्रौढ आधारभूत',
  normalAntenatalPreset: 'सामान्य गरोदर आधारभूत',
  quickVitalsHelper: 'सर्व सामान्य मानके एका टॅपमध्ये भरा आणि आवश्यक ते बदला',
  searchPatientPlaceholder: 'नाव, गाव, फोन किंवा आभा आयडीने शोधा...',
  oneTapFollowUpBtn: 'फॉलो-अप कार्य',
  quickVitalsBtn: 'व्हायटल्स भरा',
  highRiskPregnancyAlert: 'उच्च जोखीम गरोदरपण चेतावणी',
  criticalUrgencyAlert: 'गंभीर तात्काळ वैद्यकीय लक्ष आवश्यक',
  bpStepperLabel: 'रक्तदाब बदल (+/- ५)',
  hrStepperLabel: 'नाडी बदल (+/- २)',
  spo2StepperLabel: 'ऑक्सिजन बदल (+/- १)',

  liveUrgentQueue: 'थेट तातडीची रांग',
  recentEventsTitle: 'महत्त्वाच्या अलीकडील घडामोडी',
  noRecentEvents: 'सध्या कोणत्याही नवीन नोंदी नाहीत',
  queueStatusRealtime: 'थेट अपडेट सुरू',

  voiceInputTitle: 'आवाज सहाय्यक',
  voiceListening: 'ऐकत आहे... बोला',
  voiceStartListening: 'आवाजाने बोला',
  voiceStopListening: 'थांबवा',
  voiceSpeakSummary: 'माहिती ऐका',
  voiceStopSpeaking: 'आवाज थांबवा',
  voiceNotSupported: 'आपल्या ब्राउझरमध्ये आवाज सुविधा उपलब्ध नाही',
  voicePermissionDenied: 'मायक्रोफोन परवानगी नाकारली गेली',
  voiceError: 'आवाज प्रक्रियेत अडचण आली'
};

export const phaseDHindi: PhaseDTranslations = {
  syncStateOffline: 'ऑफ़लाइन (स्थानीय डेटा सुरक्षित)',
  syncStateSyncing: 'डेटा क्लाउड पर सिंक हो रहा है...',
  syncStateSynced: 'सभी डेटा सिंक हो चुका है',
  syncStateFailed: 'सिंक विफल (पुनः प्रयास करें)',
  retryAllBtn: 'सभी पुनः सिंक करें',
  retryItemBtn: 'पुनः प्रयास करें',
  failedItemsTitle: 'विफल प्रविष्टियां',
  noFailedItems: 'कोई प्रविष्टि विफल नहीं है',
  unresolvedSyncLabel: 'लंबित प्रविष्टियां',
  lastSyncLabel: 'अंतिम सिंक समय',
  realtimeConnected: 'लाइव नेटवर्क सक्रिय',
  realtimeDisconnected: 'लाइव नेटवर्क डिस्कनेक्टेड',
  realtimeFallback: 'नियमित पोलिंग सक्रिय',

  notificationsTitle: 'सूचना केंद्र',
  noNotifications: 'कोई नई सूचना नहीं है',
  markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
  clearNotifications: 'सूचनाएं हटाएं',
  newUrgentCaseAlert: 'नया आपातकालीन मामला मिला',
  referralUpdateAlert: 'रेफरल स्थिति में बदलाव',
  followUpOverdueAlert: 'आशा गृहभेंट समय समाप्त',
  syncFailureAlert: 'ऑफ़लाइन सिंक त्रुटि',
  systemEventAlert: 'महत्वपूर्ण सिस्टम सूचना',
  viewDetailsBtn: 'विवरण देखें',

  quickPresetsTitle: 'त्वरित प्रविष्टियां (एक टैप में)',
  normalAdultPreset: 'सामान्य वयस्क बेसलाइन',
  normalAntenatalPreset: 'सामान्य प्रसवपूर्व बेसलाइन',
  quickVitalsHelper: 'एक टैप में सामान्य वाइटल्स भरें और आवश्यकतानुसार बदलें',
  searchPatientPlaceholder: 'नाम, गांव, फोन या आभा आईडी से खोजें...',
  oneTapFollowUpBtn: 'फॉलो-अप कार्य',
  quickVitalsBtn: 'वाइटल्स दर्ज करें',
  highRiskPregnancyAlert: 'उच्च जोखिम गर्भावस्था चेतावनी',
  criticalUrgencyAlert: 'गंभीर आपातकालीन चिकित्सा ध्यान आवश्यक',
  bpStepperLabel: 'रक्तचाप समायोजन (+/- 5)',
  hrStepperLabel: 'हार्ट रेट समायोजन (+/- 2)',
  spo2StepperLabel: 'ऑक्सीजन समायोजन (+/- 1)',

  liveUrgentQueue: 'लाइव आपातकालीन कतार',
  recentEventsTitle: 'हाल की महत्वपूर्ण घटनाएं',
  noRecentEvents: 'फिलहाल कोई हाल की गतिविधि नहीं है',
  queueStatusRealtime: 'लाइव अपडेट सक्रिय',

  voiceInputTitle: 'वॉयस असिस्टेंट',
  voiceListening: 'सुन रहा है... बोलिए',
  voiceStartListening: 'बोलकर पूछें',
  voiceStopListening: 'रोकें',
  voiceSpeakSummary: 'विवरण सुनें',
  voiceStopSpeaking: 'ध्वनि रोकें',
  voiceNotSupported: 'आपके ब्राउज़र में वॉयस इनपुट समर्थित नहीं है',
  voicePermissionDenied: 'माइक्रोफ़ोन की अनुमति अस्वीकृत',
  voiceError: 'वॉयस इनपुट में समस्या आई'
};

export const phaseDEnglish: PhaseDTranslations = {
  syncStateOffline: 'Offline (Data Saved Locally)',
  syncStateSyncing: 'Syncing Data to Cloud...',
  syncStateSynced: 'All Records Synchronized',
  syncStateFailed: 'Sync Incomplete (Action Required)',
  retryAllBtn: 'Retry All Pending Syncs',
  retryItemBtn: 'Retry Item',
  failedItemsTitle: 'Failed Queue Items',
  noFailedItems: 'Zero failed sync items',
  unresolvedSyncLabel: 'Unresolved Sync Items',
  lastSyncLabel: 'Last Successful Sync',
  realtimeConnected: 'Live Realtime Active',
  realtimeDisconnected: 'Live Realtime Offline',
  realtimeFallback: 'Periodic Polling Fallback Active',

  notificationsTitle: 'Notification Center',
  noNotifications: 'No new notifications',
  markAllRead: 'Mark all as read',
  clearNotifications: 'Clear all',
  newUrgentCaseAlert: 'Urgent Care Signal Detected',
  referralUpdateAlert: 'Referral Status Transition',
  followUpOverdueAlert: 'Overdue ASHA Follow-up Visit',
  syncFailureAlert: 'Offline Sync Queue Conflict',
  systemEventAlert: 'System Health Notification',
  viewDetailsBtn: 'View Details',

  quickPresetsTitle: 'Quick Vitals Presets',
  normalAdultPreset: 'Normal Adult Baseline',
  normalAntenatalPreset: 'Normal Antenatal Baseline',
  quickVitalsHelper: 'Populate standard healthy parameters in one tap and adjust as needed',
  searchPatientPlaceholder: 'Search by Name, Village, Phone, or ABHA ID...',
  oneTapFollowUpBtn: 'Follow-up Task',
  quickVitalsBtn: 'Record Vitals',
  highRiskPregnancyAlert: 'High-Risk Pregnancy Flagged',
  criticalUrgencyAlert: 'Critical Clinical Urgency Detected',
  bpStepperLabel: 'BP Stepper (+/- 5)',
  hrStepperLabel: 'Pulse Stepper (+/- 2)',
  spo2StepperLabel: 'SpO2 Stepper (+/- 1)',

  liveUrgentQueue: 'Live Urgent Queue',
  recentEventsTitle: 'Recent Operational Events',
  noRecentEvents: 'No recent events recorded',
  queueStatusRealtime: 'Live Updates Active',

  voiceInputTitle: 'Voice Care Assistant',
  voiceListening: 'Listening... Please speak',
  voiceStartListening: 'Voice Input',
  voiceStopListening: 'Stop Listening',
  voiceSpeakSummary: 'Listen to Summary',
  voiceStopSpeaking: 'Stop Audio',
  voiceNotSupported: 'Speech recognition is not supported in this browser',
  voicePermissionDenied: 'Microphone permission denied',
  voiceError: 'Voice processing encountered an error'
};

export const phaseDTranslations: Record<'mr' | 'hi' | 'en', PhaseDTranslations> = {
  mr: phaseDMarathi,
  hi: phaseDHindi,
  en: phaseDEnglish
};

export function getPhaseDI18n(locale: string = 'en'): PhaseDTranslations {
  if (locale === 'mr') return phaseDMarathi;
  if (locale === 'hi') return phaseDHindi;
  return phaseDEnglish;
}
