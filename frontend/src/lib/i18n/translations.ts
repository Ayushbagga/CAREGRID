export type SupportedLocale = 'mr' | 'hi' | 'en';

export const translations = {
  mr: {
    appTitle: 'केअरग्रिड (CAREGRID)',
    appSubtitle: 'ग्रामीण आरोग्य सेवा समन्वय व सुलभता मंच',
    governmentTag: 'महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग',
    offlineBanner: 'ऑफलाइन मोड: इंटरनेट उपलब्ध नाही. डेटा स्थानिक पातळीवर जतन केला जात आहे.',
    onlineSyncBanner: 'इंटरनेट उपलब्ध: स्थानिक डेटा सुरक्षितपणे सिंक होत आहे...',
    pendingRecords: 'प्रलंबित नोंदी',
    roleAsha: 'आशा सेविका / एएनएम',
    roleDoctor: 'वैद्यकीय अधिकारी (PHC/CHC)',
    roleCitizen: 'नागरिक / रुग्ण',
    roleReferral: 'संदर्भ सेवा (Referral)',
    roleAdmin: 'जिल्हा / राज्य नियंत्रण कक्ष',
    triageEmergency: 'तात्काळ (Emergency Red)',
    triageUrgent: 'तातडीचे (Urgent Amber)',
    triageRoutine: 'नियमित (Routine Green)',
    disclaimer: 'सूचना: एआय प्रणाली केवळ वैद्यकीय कर्मचाऱ्यांना प्राधान्य ठरवण्यात मदत करते, निदान करत नाही.'
  },
  hi: {
    appTitle: 'केयरग्रिड (CAREGRID)',
    appSubtitle: 'ग्रामीण स्वास्थ्य सेवा समन्वय एवं सुगमता मंच',
    governmentTag: 'महाराष्ट्र सरकार — सार्वजनिक स्वास्थ्य विभाग',
    offlineBanner: 'ऑफ़लाइन मोड: इंटरनेट उपलब्ध नहीं है। डेटा स्थानीय रूप से सहेजा जा रहा है।',
    onlineSyncBanner: 'इंटरनेट उपलब्ध: डेटा सुरक्षित रूप से सिंक हो रहा है...',
    pendingRecords: 'लंबित रिकॉर्ड्स',
    roleAsha: 'आशा कार्यकर्ता / एएनएम',
    roleDoctor: 'चिकित्सा अधिकारी (PHC/CHC)',
    roleCitizen: 'नागरिक / मरीज',
    roleReferral: 'रेफरल प्रबंधन',
    roleAdmin: 'जिला / राज्य डैशबोर्ड',
    triageEmergency: 'आपातकालीन (Emergency Red)',
    triageUrgent: 'अति आवश्यक (Urgent Amber)',
    triageRoutine: 'सामान्य (Routine Green)',
    disclaimer: 'सूचना: एआई प्रणाली केवल स्वास्थ्य कर्मियों को प्राथमिकता तय करने में सहायता करती है, निदान नहीं करती।'
  },
  en: {
    appTitle: 'CAREGRID',
    appSubtitle: 'Rural Healthcare Access & Care Coordination Platform',
    governmentTag: 'Government of Maharashtra — Public Health Department',
    offlineBanner: 'Offline Mode: No network connection. Data is being stored locally on your device.',
    onlineSyncBanner: 'Connected: Syncing offline records with CAREGRID cloud...',
    pendingRecords: 'Pending Records',
    roleAsha: 'ASHA / ANM Field Worker',
    roleDoctor: 'PHC / CHC Medical Officer',
    roleCitizen: 'Citizen / Patient',
    roleReferral: 'Referral Coordination',
    roleAdmin: 'District / State Dashboard',
    triageEmergency: 'Emergency (Red Tier)',
    triageUrgent: 'Urgent (Amber Tier)',
    triageRoutine: 'Routine (Green Tier)',
    disclaimer: 'Notice: AI assists healthcare staff in clinical prioritization; it does NOT formulate diagnoses.'
  }
};
