// Real-World Physical Phone Emergency SMS & Instant Push Broadcast Service
// Connects to ntfy.sh for 0.5s zero-cost over-the-air smartphone vibration & push notification
// Fully multilingual: English, Hindi, Assamese, Gujarati

export type BroadcastLanguage = 'en' | 'hi' | 'as' | 'gu';

export interface BroadcastParams {
  phone?: string;
  topic?: string;
  language?: BroadcastLanguage;
  theaterName?: string;
  corridorName?: string;
  breachWidth?: number;
  allocationTool?: string;
  nearestHospital?: string;
  detourMins?: number;
  dryRoadheadName?: string;
}

export interface BroadcastResult {
  success: boolean;
  timestamp: string;
  topic: string;
  smsPayload: string;
  language: BroadcastLanguage;
  statusCode?: number;
  error?: string;
}

export function constructEvacuationMessage(params: BroadcastParams): string {
  const lang = params.language || 'en';
  const theater = (params.theaterName || 'Silchar Basin').toUpperCase();
  const corridor = params.corridorName || 'JT Road';
  const breachM = params.breachWidth ?? 38;
  const tool = params.allocationTool || 'bridge';
  const hospital = params.nearestHospital || 'Valley Hospital';
  const detour = params.detourMins ?? 65;
  const roadhead = params.dryRoadheadName || 'JT North Roadhead (600m before water)';

  let actionTextEn = '';
  let actionTextHi = '';
  let actionTextAs = '';
  let actionTextGu = '';

  if (tool === 'bridge') {
    actionTextEn = 'Army Class-40 Bailey Bridge installation underway. Reopening in 48h.';
    actionTextHi = 'सेना द्वारा क्लास-40 बेली ब्रिज लगाया जा रहा है। 48 घंटे में मार्ग बहाल होगा।';
    actionTextAs = 'সেনাৰ দ্বাৰা ক্লাছ-৪০ বেইলি দলং স্থাপন চলি আছে। ৪৮ ঘণ্টাত মুকলি হ\'ব।';
    actionTextGu = 'આર્મી ક્લાસ-40 બેઇલી બ્રિજ બનાવવાનું કામ ચાલુ છે. 48 કલાકમાં ફરી શરૂ થશે.';
  } else if (tool === 'booth') {
    actionTextEn = `A Mobile Medical Unit (MMU) is active at ${roadhead}. ETA: 15 mins.`;
    actionTextHi = `एक मोबाइल मेडिकल यूनिट (MMU) ${roadhead} पर सक्रिय है। ईटीए: 15 मिनट।`;
    actionTextAs = `এখন মোবাইল মেডিকেল ইউনিট (MMU) ${roadhead} ত সক্ৰিয়। ১৫ মিনিটত সেৱা উপলব্ধ।`;
    actionTextGu = `એક મોબાઇલ મેડિકલ યુનિટ (MMU) ${roadhead} પર સક્રિય છે. ETA: 15 મિનિટ.`;
  } else if (tool === 'drone') {
    actionTextEn = 'Heavy Med-Drones dispatched with Anti-Snakebite Venom & Blood to village school drop-zone.';
    actionTextHi = 'सर्पदंश एंटीवेनम और रक्त के साथ भारी मेडिकल ड्रोन गांव के स्कूल ड्रॉप-जोन में तैनात।';
    actionTextAs = 'সৰ্পদংশন এণ্টিভেনম আৰু তেজ লৈ চিকিৎসা ড্ৰোন গাঁৱৰ বিদ্যালয়ত নিয়োজিত।';
    actionTextGu = 'સાપ કરડવાની એન્ટિવેનમ અને રક્ત સાથે ભારે મેડિકલ ડ્રોન ગામની શાળા ડ્રોપ-ઝોનમાં તૈનાત.';
  } else if (tool === 'boat') {
    actionTextEn = 'NDRF Motorized Zodiac assault boats ferrying dialysis and trauma patients across the water.';
    actionTextHi = 'एनडीआरएफ मोटरयुक्त जोडियाक नावें डायलिसिस और ट्रॉमा मरीजों को पानी के पार ले जा रही हैं।';
    actionTextAs = 'এনডিআৰএফ মটৰযুক্ত বোটৰ দ্বাৰা ডায়েলিচিছ আৰু জৰুৰী ৰোগী স্থানান্তৰ চলি আছে।';
    actionTextGu = 'એનડીઆરએફ મોટરબોટ દ્વારા ડાયાલિસિસ અને ટ્રોમા દર્દીઓને પાણી પાર લઈ જવામાં આવી રહ્યા છે.';
  } else {
    actionTextEn = 'SDRF and District Emergency Operations Center are monitoring the flood crest.';
    actionTextHi = 'एसडीआरएफ और जिला आपातकालीन परिचालन केंद्र बाढ़ के स्तर की निगरानी कर रहे हैं।';
    actionTextAs = 'এছডিআৰএফ আৰু জিলা জৰুৰী নিয়ন্ত্ৰণ কক্ষই বান পৰিস্থিতি নিৰীক্ষণ কৰি আছে।';
    actionTextGu = 'એસડીઆરએફ અને જિલ્લા કટોકટી ઓપરેશન સેન્ટર પૂરના સ્તર પર નજર રાખી રહ્યા છે.';
  }

  switch (lang) {
    case 'hi':
      return `🚨 एनडीएमए / एसईओसी आपातकालीन चेतावनी [${theater}]: ${corridor} पुल जलमग्न है (${breachM} मीटर दरार)। पार न करें। ${actionTextHi} निकटतम सुरक्षित आईसीयू: ${hospital} (${detour} मिनट)। आपातकालीन हेल्पलाइन: 1070 / 112.`;
    case 'as':
      return `🚨 এনডিএমএ / এছডিএমএ জৰুৰী সতৰ্কবাৰ্তা [${theater}]: ${corridor} দলং বানপানীত নিমজ্জিত (${breachM} মিটাৰ ফাঁক)। পাৰ নহ'ব। ${actionTextAs} নিকটৱৰ্তী নিৰাপদ আইচিইউ: ${hospital} (${detour} মিনিট)। হেল্পলাইন: ১০৭০ / ১১২।`;
    case 'gu':
      return `🚨 એનડીએમએ / એસઈઓસી કટોકટી ચેતવણી [${theater}]: ${corridor} બ્રિજ પાણીમાં ડૂબી ગયો છે (${breachM} મીટર ગેપ). ઓળંગશો નહીં. ${actionTextGu} નજીકની સલામત આઈસીયુ: ${hospital} (${detour} મિનિટ). હેલ્પલાઇન: 1070 / 112.`;
    case 'en':
    default:
      return `🚨 NDMA / SEOC EMERGENCY ALERT [${theater}]: ${corridor} Bridge is SUBMERGED (${breachM}m gap). DO NOT CROSS. ${actionTextEn} Nearest Safe ICU: ${hospital} (${detour}m via bypass). Helpline: 1070 / 112.`;
  }
}

export async function dispatchLivePhoneAlert(params: BroadcastParams): Promise<BroadcastResult> {
  const topic = (params.topic || 'lifeline-os-alert-2026').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const corridor = params.corridorName || 'JT Road';
  const lang = params.language || 'en';
  const smsMessageText = constructEvacuationMessage(params);

  // Trigger hardware vibration if supported on device (Haptic Feedback)
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 500]);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  // Also trigger Web Notification if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`EMERGENCY SEOC ALERT: ${corridor} Cut-Off`, {
        body: smsMessageText,
        icon: '/favicon.ico',
      });
    } catch {
      // Ignore notification error
    }
  }

  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: smsMessageText,
      headers: {
        'Title': `EMERGENCY SEOC ALERT: ${corridor} Cut-Off`,
        'Priority': 'urgent',
        'Tags': 'rotating_light,warning,hospital,satellite',
        'Click': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
      },
    });

    return {
      success: response.ok,
      statusCode: response.status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      topic,
      smsPayload: smsMessageText,
      language: lang,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network request failed',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      topic,
      smsPayload: smsMessageText,
      language: lang,
    };
  }
}
