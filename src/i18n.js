// Single-language UI. Bangla by default, English on request.
// Nothing renders in two languages at once.

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const STRINGS = {
  bn: {
    brand: 'মামলা খাই',
    brandSub: '৩০০ ফুট · ঢাকা · রাত ১২:৪০',
    tagline: 'ঢাকার সবচেয়ে চওড়া রাস্তা, আর সবচেয়ে কড়া চেকপোস্ট। নিয়ম ভাঙুন, পুলিশ ফাঁকি দিন, আর পাশের ক্যালকুলেটরে জরিমানা বাড়তে দেখুন।',
    start: 'ইঞ্জিন স্টার্ট',
    navSteer: 'স্টিয়ার',
    navGas: 'গ্যাস',
    navBrake: 'ব্রেক',
    navTouch: 'মোবাইলে টাচ কন্ট্রোল',
    credit: '৩০০ ফুট রোডে এক রাতের যাত্রা · ফ্যান-মেড আর্কেড',

    back: 'ফিরে যান',
    setupTitle: 'গাড়ি বেছে নিন',
    setupSub: 'নিচের প্রতিটি সিদ্ধান্তই একটা আইন — যেটা আপনি ভাঙতে পারেন।',
    people: 'কতজন উঠবে',
    peopleMax: 'ড্রাইভারসহ · সর্বোচ্চ {n} জন',
    peopleOkCar: 'গাড়িতে পাঁচজনের বেশি উঠলে ওভারলোডিং।',
    peopleBadCar: 'ওভারলোডিং · {amount} জরিমানা। ৫ সিটের গাড়িতে {n} জন।',
    peopleOkBike: 'বাইকে তিনজন বা বেশি উঠলে ট্রিপল রাইডিং।',
    peopleBadBike: 'ট্রিপল রাইডিং · {amount} জরিমানা। এক বাইকে {n} জন।',
    seatbelt: 'সিটবেল্ট',
    seatbeltSub: 'শোরুম থেকে সোজা, একবারও ব্যবহার হয়নি।',
    seatbeltBad: 'সিটবেল্ট না থাকলে {amount} জরিমানা।',
    helmet: 'হেলমেট',
    helmetSub: 'ফোমের খোলস, ভরসায় আটকানো।',
    helmetBad: 'হেলমেট ছাড়া বাইক চালালে {amount} জরিমানা।',
    licence: 'ড্রাইভিং লাইসেন্স',
    licenceSub: 'সত্যিই আছে তো?',
    licenceBad: 'লাইসেন্স না থাকলে {amount} এবং বাকি সব জরিমানায় ৫০% বেশি।',
    legal: 'আইনসম্মত। আপাতত।',
    ride: 'চালায় যান',
    pendingRecord: 'শুরুর আগেই মামলা · {amount}',
    pendingOne: 'শুরুতেই একটা মামলা জমেছে',
    pendingMany: 'শুরুতেই {n}টি মামলা জমেছে',
    cleanRecord: 'নথি পরিষ্কার। {vehicle} · {n} জন · লাইসেন্স পকেটে',
    cardSpeed: '{kmh} কিমি/ঘণ্টা',

    limit: 'সীমা',
    life: 'গাড়ির অবস্থা',
    pause: 'বিরতি',
    pausedTitle: 'খেলা থামানো',
    pauseHint: 'Esc চাপলে আবার চালু হবে',
    pauseHintTouch: 'চালিয়ে যান চাপলে খেলা চলবে',
    resume: 'চালিয়ে যান',
    unitKmh: 'কিমি/ঘণ্টা',
    unitMeter: 'মি',
    checkpost: 'চেকপোস্ট',
    levelShort: 'স্তর',
    calculator: 'জরিমানা ক্যালকুলেটর',
    total: 'মোট',
    notePending: 'চালান বাকি · এখনও ধরা পড়েননি',
    noteLicence: 'লাইসেন্স নেই · স্টেশনে +৫০%',
    noCases: 'এখনও কোনো মামলা নেই। এভাবেই থাকুক?',

    caseFiled: 'মামলা দায়ের',
    caseLine: 'ডিএমপি ট্রাফিক · কেস #{case} · ৩০০ ফুট',
    totalFine: 'মোট জরিমানা',
    statDistance: 'দূরত্ব',
    statTop: 'সর্বোচ্চ গতি',
    statCheckpoints: 'চেকপোস্ট',
    statCrashes: 'দুর্ঘটনা',
    rideAgain: 'আবার চালাই',
    changeVehicle: 'গাড়ি বদলান',

    'vehicle.car.name': 'গাড়ি',
    'vehicle.car.blurb': 'পুরনো চার দরজার সেডান। যাত্রী তোলার জায়গা প্রচুর।',
    'vehicle.bike.name': 'বাইক',
    'vehicle.bike.blurb': '১৫০ সিসি স্ট্রিট বাইক। ট্যাংকে কোনো নাম নেই।',

    'fine.noSeatbelt': 'সিটবেল্ট নেই',
    'fine.noHelmet': 'হেলমেট নেই',
    'fine.tripleRide': 'ট্রিপল রাইডিং',
    'fine.overloading': 'অতিরিক্ত যাত্রী',
    'fine.overspeed': 'অতিরিক্ত গতি',
    'fine.signal': 'সিগন্যাল ভাঙা',
    'fine.wrongSide': 'ভুল লেনে চালানো',
    'fine.rough': 'রাফ ড্রাইভিং',
    'fine.accident': 'দুর্ঘটনা',
    'fine.damage': 'ক্ষতিপূরণ',
    'fine.noLicense': 'লাইসেন্স ছাড়া চালানো',
    'fine.fled': 'চেকপোস্ট এড়ানো',
    'fine.noStop': 'চেকপোস্টে না থামা',

    'detail.overspeed': '{limit} সীমায় {kmh} কিমি/ঘণ্টা',
    'detail.tripleRide': 'এক বাইকে {n} জন',
    'detail.overloading': '{n} যাত্রী',
    'detail.accident': '{kind}-এ ধাক্কা',
    'detail.damage': '{kind}-এর মেরামত',
    'detail.fled': 'স্তর {level} চেকপোস্ট এড়ানো',
    'detail.signal': 'লাল বাতি ভেঙে গেছেন',
    'detail.wrongSide': 'উল্টো লেনে গাড়ি',
    'detail.rough': 'গতিতে আঁকাবাঁকা',
    'detail.noStop': 'চেকপোস্টে থামিয়ে দেওয়া হয়েছে',
    'detail.licenceSurcharge': 'বাকি সব মামলায় +৫০%',

    'kind.car': 'গাড়ি',
    'kind.bus': 'বাস',
    'kind.truck': 'ট্রাক',
    'kind.rickshaw': 'রিকশা',
    'kind.bike': 'বাইক',

    'toast.crash': 'ধাক্কা! {kind} ক্ষতিগ্রস্ত · {amount}',
    'toast.signal': 'সিগন্যাল ভাঙা! পুলিশকে জানানো হয়েছে।',
    'toast.wrongSide': 'ভুল লেনে! ওপাশের লেনে চলে গেছেন।',
    'toast.rough': 'রাফ ড্রাইভিং। সামনে চেকপোস্ট।',
    'toast.overspeed': 'অতিরিক্ত গতি · {kmh} কিমি/ঘণ্টা',
    'toast.checkpost': 'চেকপোস্ট · স্তর {level} · {hint}',
    'toast.checkpostGap': 'ফাঁক খুঁজুন',
    'toast.checkpostBlock': 'এই পাশ বন্ধ, ওপাশ দিয়ে যান',
    'toast.evaded': 'ফাঁক পেয়ে গেলাম! চেকপোস্ট এড়ানো হয়েছে',
    'toast.caught': 'ধরা পড়েছেন! রিপোর্টাররা ছুটে আসছে…',
    'toast.wreck': 'গাড়ি আর চলছে না! পুলিশ আর রিপোর্টার এসেছে।',
    'toast.lifeLow': 'গাড়ি ভাঙছে! সাবধানে।',
  },

  en: {
    brand: 'MAMLA KHAI',
    brandSub: '300 FEET · DHAKA · 12:40 AM',
    tagline: "Dhaka's widest road and its strictest checkposts. Break the law, dodge the police, and watch the fine calculator climb.",
    start: 'START ENGINE',
    navSteer: 'steer',
    navGas: 'gas',
    navBrake: 'brake',
    navTouch: 'touch controls on mobile',
    credit: 'A night ride on the 300 Feet Road · Fan-made arcade',

    back: 'back',
    setupTitle: 'Pick your ride',
    setupSub: 'Everything you choose below is a law you may or may not be breaking.',
    people: 'People on board',
    peopleMax: 'Driver included · max {n}',
    peopleOkCar: 'More than five people in the car is overloading.',
    peopleBadCar: 'Overloading · {amount} fine. That is {n} in a 5-seater.',
    peopleOkBike: 'Three or more on a bike is triple riding.',
    peopleBadBike: 'Triple riding · {amount} fine. {n} on one bike.',
    seatbelt: 'Seatbelt',
    seatbeltSub: 'Straight from the showroom, never used.',
    seatbeltBad: 'No seatbelt is a {amount} case.',
    helmet: 'Helmet',
    helmetSub: 'A Styrofoam shell held on by hope.',
    helmetBad: 'Riding without a helmet is a {amount} case.',
    licence: 'Driving licence',
    licenceSub: 'Do you actually have one?',
    licenceBad: 'No licence is {amount} plus a 50% surcharge on every other fine.',
    legal: 'Legal. For now.',
    ride: 'RIDE',
    pendingRecord: 'CASE PENDING BEFORE YOU START · {amount}',
    pendingOne: 'One case already on your plate',
    pendingMany: '{n} cases already on your plate',
    cleanRecord: 'Clean record. {vehicle} · {n} on board · licence in pocket',
    cardSpeed: '{kmh} km/h',

    limit: 'LIMIT',
    life: 'VEHICLE',
    pause: 'Pause',
    pausedTitle: 'PAUSED',
    pauseHint: 'Press Esc again to resume',
    pauseHintTouch: 'Tap resume to continue',
    resume: 'RESUME',
    unitKmh: 'km/h',
    unitMeter: 'm',
    checkpost: 'CHECKPOST',
    levelShort: 'LV',
    calculator: 'FINE CALCULATOR',
    total: 'TOTAL',
    notePending: 'Challan pending · not caught yet',
    noteLicence: 'No licence: +50% added at the station',
    noCases: 'No cases yet. Keep it that way?',

    caseFiled: 'CASE FILED',
    caseLine: 'DMP TRAFFIC · CASE #{case} · 300 FEET',
    totalFine: 'TOTAL FINE',
    statDistance: 'distance',
    statTop: 'top speed',
    statCheckpoints: 'checkposts',
    statCrashes: 'crashes',
    rideAgain: 'Ride again',
    changeVehicle: 'Change vehicle',

    'vehicle.car.name': 'Car',
    'vehicle.car.blurb': 'A tired 4-door sedan. Plenty of boot space for passengers.',
    'vehicle.bike.name': 'Bike',
    'vehicle.bike.blurb': 'A sporty 150cc street bike. Nothing printed on the tank.',

    'fine.noSeatbelt': 'No seatbelt',
    'fine.noHelmet': 'No helmet',
    'fine.tripleRide': 'Triple riding',
    'fine.overloading': 'Overloading people',
    'fine.overspeed': 'Over-speeding',
    'fine.signal': 'Signal breaking',
    'fine.wrongSide': 'Wrong-side driving',
    'fine.rough': 'Rough driving',
    'fine.accident': 'Accident / collision',
    'fine.damage': 'Damage compensation',
    'fine.noLicense': 'Driving without licence',
    'fine.fled': 'Fled a police checkpost',
    'fine.noStop': 'Failure to stop at checkpost',

    'detail.overspeed': '{kmh} km/h in a {limit} zone',
    'detail.tripleRide': '{n} on one bike',
    'detail.overloading': '{n} passengers',
    'detail.accident': 'Hit a {kind}',
    'detail.damage': '{kind} repair bill',
    'detail.fled': 'Dodged level {level} checkpost',
    'detail.signal': 'Ran the red light',
    'detail.wrongSide': 'On the oncoming carriageway',
    'detail.rough': 'Zig-zagging at speed',
    'detail.noStop': 'Pulled over at the checkpost',
    'detail.licenceSurcharge': '+50% on every other case',

    'kind.car': 'car',
    'kind.bus': 'bus',
    'kind.truck': 'truck',
    'kind.rickshaw': 'rickshaw',
    'kind.bike': 'bike',

    'toast.crash': 'Bang! {kind} damaged · {amount}',
    'toast.signal': 'Signal broken! The police were informed.',
    'toast.wrongSide': 'Wrong side! You moved onto the oncoming lane.',
    'toast.rough': 'Rough driving. Checkpost ahead.',
    'toast.overspeed': 'Over-speeding · {kmh} km/h',
    'toast.checkpost': 'CHECKPOST · level {level} · {hint}',
    'toast.checkpostGap': 'find the gap',
    'toast.checkpostBlock': 'this side is blocked, use the other side',
    'toast.evaded': 'Found a gap! Checkpost dodged',
    'toast.caught': 'Caught! Reporters are running over…',
    'toast.wreck': 'The car is finished! Police and reporters are here.',
    'toast.lifeLow': 'The car is falling apart!',
  },
};

let lang = 'bn';

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (STRINGS[next]) lang = next;
}

export function t(key, vars) {
  const dict = STRINGS[lang] || STRINGS.bn;
  let out = dict[key];
  if (out === undefined) out = STRINGS.en[key];
  if (out === undefined) return key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      const v = vars[k];
      out = out.replaceAll('{' + k + '}', typeof v === 'number' ? fmtNum(v) : String(v));
    }
  }
  return out;
}

export function fmtNum(n) {
  const value = Number(n) || 0;
  const text = Math.round(value).toLocaleString('en-IN');
  return lang === 'bn' ? text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : text;
}

export function money(n) {
  return '৳ ' + fmtNum(n);
}
