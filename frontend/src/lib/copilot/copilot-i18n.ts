import type { SupportedLocale } from '@/lib/i18n/translations';

export interface CopilotDictionary {
  copilotTitle: string;
  copilotSubtitle: string;
  commandCenterTitle: string;
  commandCenterDesc: string;
  urgentCases: string;
  pendingReferrals: string;
  overdueFollowUps: string;
  queueHealth: string;
  healthy: string;
  quickPromptsLabel: string;
  promptPriorityCases: string;
  promptPendingReferrals: string;
  promptOverdueFollowups: string;
  promptCommandCenter: string;
  verifiedDataLabel: string;
  protocolSignalsLabel: string;
  assistantSummaryLabel: string;
  actionConfirmTitle: string;
  actionConfirmDesc: string;
  confirmBtn: string;
  cancelBtn: string;
  actionSuccess: string;
  inputPlaceholder: string;
  sendBtn: string;
  offlineNotice: string;
  nonDiagnosticDisclaimer: string;
  groundedEngine: string;
}

export const copilotTranslations: Record<SupportedLocale, CopilotDictionary> = {
  mr: {
    copilotTitle: 'केअरग्रिड कोपायलट (Care Copilot)',
    copilotSubtitle: 'क्लिनिकल समन्वय व ऑपरेशनल सहाय्यक (Non-Diagnostic)',
    commandCenterTitle: 'कमांड सेंटर डॅशबोर्ड (Command Center)',
    commandCenterDesc: 'स्थानिक प्राथमिक आरोग्य केंद्र व उपकेंद्र रिअल-टाइम स्थिती',
    urgentCases: 'तातडीचे / उच्च जोखीम रुग्ण',
    pendingReferrals: 'प्रलंबित संदर्भ सेवा (Pending Ack)',
    overdueFollowUps: 'मुदत उलटलेल्या आशा गृहभेटी',
    queueHealth: 'ओपीडी रांग व सिंक स्थिती',
    healthy: 'सुरळीत (Healthy)',
    quickPromptsLabel: 'जलद कार्य कृती (Quick Actions):',
    promptPriorityCases: '🚨 सर्वोच्च प्राधान्य रुग्ण',
    promptPendingReferrals: '📋 प्रलंबित रुग्णालय संदर्भ',
    promptOverdueFollowups: '⏰ मुदत उलटलेल्या गृहभेटी',
    promptCommandCenter: '⚡ कमांड सेंटर सद्यस्थिती',
    verifiedDataLabel: 'प्रमाणित रेकॉर्ड डेटा (Verified Records)',
    protocolSignalsLabel: 'क्लिनिकल प्रोटोकॉल सिग्नल्स (Protocol Signals)',
    assistantSummaryLabel: 'ऑपरेशनल मार्गदर्शन (Operational Assist)',
    actionConfirmTitle: 'कृती पुष्टीकरण आवश्यक (Confirmation Required)',
    actionConfirmDesc: 'या पाठपुरावा कार्याला तात्काळ प्राधान्य देण्यासाठी आपली संमती आवश्यक आहे.',
    confirmBtn: 'होय, कार्य वाढवा (Escalate)',
    cancelBtn: 'रद्द करा (Cancel)',
    actionSuccess: 'कार्य यशस्वीरीत्या वाढवण्यात आले (Escalated)!',
    inputPlaceholder: 'रुग्ण, संदर्भ किंवा कामाबद्दल विचारा...',
    sendBtn: 'विचारा',
    offlineNotice: 'ऑफलाइन मोड: कोपायलट स्थानिक प्रोटोकॉल इंजिन वापरत आहे.',
    nonDiagnosticDisclaimer: 'वैधानिक सूचना: ही प्रणाली केवळ आरोग्य कर्मचाऱ्यांसाठी कार्य समन्वय साहाय्यक आहे. ती वैद्यकीय निदान किंवा औषधोपचार देत नाही.',
    groundedEngine: 'प्रोटोकॉल इंजिन v1.2'
  },
  hi: {
    copilotTitle: 'केयरग्रिड कोपायलट (Care Copilot)',
    copilotSubtitle: 'क्लिनिकल समन्वय एवं परिचालन सहायक (Non-Diagnostic)',
    commandCenterTitle: 'कमांड सेंटर डैशबोर्ड (Command Center)',
    commandCenterDesc: 'प्राथमिक स्वास्थ्य केंद्र एवं उपकेंद्र वास्तविक समय स्थिति',
    urgentCases: 'अति-आवश्यक / उच्च जोखिम मरीज',
    pendingReferrals: 'लंबित रेफरल सेवाएं (Pending Ack)',
    overdueFollowUps: 'अतिदेय आशा गृह भेंट कार्य',
    queueHealth: 'ओपीडी कतार एवं सिंक स्थिति',
    healthy: 'सामान्य (Healthy)',
    quickPromptsLabel: 'त्वरित परिचालन क्रियाएँ (Quick Actions):',
    promptPriorityCases: '🚨 सर्वोच्च प्राथमिकता मरीज',
    promptPendingReferrals: '📋 अस्पताल स्वीकृति प्रतीक्षित रेफरल',
    promptOverdueFollowups: '⏰ अतिदेय आशा गृह भेंट',
    promptCommandCenter: '⚡ कमांड सेंटर वर्तमान स्थिति',
    verifiedDataLabel: 'सत्यापित रिकॉर्ड डेटा (Verified Records)',
    protocolSignalsLabel: 'क्लिनिकल प्रोटोकॉल संकेत (Protocol Signals)',
    assistantSummaryLabel: 'परिचालन मार्गदर्शन (Operational Assist)',
    actionConfirmTitle: 'कार्रवाई पुष्टि आवश्यक (Confirmation Required)',
    actionConfirmDesc: 'इस अनुवर्ती कार्य को प्राथमिकता देने के लिए आपकी स्पष्ट स्वीकृति आवश्यक है।',
    confirmBtn: 'हाँ, कार्य प्राथमिकता दें (Escalate)',
    cancelBtn: 'रद्द करें (Cancel)',
    actionSuccess: 'कार्य सफलतापूर्वक प्राथमिकता दी गई (Escalated)!',
    inputPlaceholder: 'मरीज, रेफरल या कार्यों के बारे में पूछें...',
    sendBtn: 'पूछें',
    offlineNotice: 'ऑफ़लाइन मोड: कोपायलट स्थानीय प्रोटोकॉल इंजन का उपयोग कर रहा है।',
    nonDiagnosticDisclaimer: 'वैधानिक सूचना: यह प्रणाली केवल स्वास्थ्य कर्मियों के लिए कार्य समन्वय सहायक है। यह चिकित्सीय निदान या दवा नहीं लिखती।',
    groundedEngine: 'प्रोटोकॉल इंजन v1.2'
  },
  en: {
    copilotTitle: 'CAREGRID Care Copilot',
    copilotSubtitle: 'Intelligent Care Coordination & Operational Assistant (Non-Diagnostic)',
    commandCenterTitle: 'CAREGRID Command Center',
    commandCenterDesc: 'Real-time frontline healthcare operational situation monitor',
    urgentCases: 'Urgent / High-Risk Cases',
    pendingReferrals: 'Referrals Awaiting Ack',
    overdueFollowUps: 'Overdue ASHA Home Visits',
    queueHealth: 'OPD Queue & Sync Health',
    healthy: 'Healthy & Synced',
    quickPromptsLabel: 'Operational Quick Actions:',
    promptPriorityCases: '🚨 Highest-Priority Cases',
    promptPendingReferrals: '📋 Pending Hospital Referrals',
    promptOverdueFollowups: '⏰ Overdue ASHA Visits',
    promptCommandCenter: '⚡ Command Center Status',
    verifiedDataLabel: 'Verified System Records',
    protocolSignalsLabel: 'Clinical Protocol Safety Signals',
    assistantSummaryLabel: 'Operational Copilot Guidance',
    actionConfirmTitle: 'Action Confirmation Required',
    actionConfirmDesc: 'This consequential escalation updates the task and alerts field supervisors. Explicit confirmation required.',
    confirmBtn: 'Confirm Escalation',
    cancelBtn: 'Cancel',
    actionSuccess: 'Follow-up task successfully escalated and audited!',
    inputPlaceholder: 'Ask about high-risk cases, referrals, follow-ups...',
    sendBtn: 'Send',
    offlineNotice: 'Offline Mode: Care Copilot running on local protocol engine.',
    nonDiagnosticDisclaimer: 'Statutory Disclaimer: CAREGRID Care Copilot is an operational coordination aid for certified healthcare personnel. It does NOT diagnose conditions or prescribe medications.',
    groundedEngine: 'Protocol Engine v1.2'
  }
};

export function getCopilotI18n(locale: SupportedLocale): CopilotDictionary {
  return copilotTranslations[locale] || copilotTranslations.en;
}
