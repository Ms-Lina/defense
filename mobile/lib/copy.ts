/**
 * Centralized Kinyarwanda copy for MenyAI.
 * Keeps wording natural, consistent, and appropriate for literacy learners.
 */

export const copy = {
  // Auth
  auth: {
    loginSuccess: "Winjiye neza!",
    registerSuccess: "Wiyandikishije neza. Injira ubu.",
    loginCta: "Injira",
    loginSubtitle: "Injira ubone iterambere ryawe",
    registerDoneCta: "Wiyandikishije neza. Injira ubu.",
    pinResetSuccess: "Injira ubu ukoze PIN nshya.",
    wrongCreds: "Nimero cyangwa PIN nibiwe. Gerageza.",
    errorGeneric: "Byabuze. Gerageza.",
    errorTryAgain: "Byabuze. Wongere kugerageza.",
    phonePlaceholder: "Urugero: 07xx xxx xxx",
    namePlaceholder: "Urugero: Amazina",
  },

  // Lessons
  lessons: {
    title: "Amasomo",
    subtitle: (n: number) => `Amasomo ${n} — Hitamo isomo wiga`,
    noLessons: "Nta masomo ahari ubu.",
    noLessonsHint: "Niba ufite intangiriro, kanda Ongera Ugerageze.",
    startExercises: "Tangira Imyitozo",
    next: "Komeza",
    submit: "Ohereza",
    confirmAnswer: "Kwemeza",
    correct: "Yego! Wabikoze neza! Umeze ku wihangire!",
    incorrect: (correctAnswer: string) => `Oya. Wongere ugerageze. Igisubizo ni: ${correctAnswer}`,
    resultPass: "Wakunze isomo neza! Umeze ku wihangire!",
    resultPassSubtitle: "Isomo ryarangiwe. Reba iterambere yawe kuri Iterambere.",
    resultFail: "Subira ugerageze. Urakwihangira neza!",
    backToLessons: "Subira ku Meza",
    retry: "Ongera Ugerageze",
    submitError: "Ntabwo twashoboye kohereza. Gerageza nyuma.",
    noVideo: "Nta videwo iri.",
    typePlaceholder: "Andika hano...",
    recordHint: "Kanda hano ufate amajwi",
    recording: "Kurura ukura uruhushya...",
  },

  // Progress & grades
  progress: {
    title: "Iterambere",
    subtitle: "Reba aho ugejeje wiga",
    loading: "Tegereza amakuru...",
    overallPercentage: "Aho ugeze wiga",
    completedCount: (a: number, b: number) => `${a} muri ${b} amasomo yarangiye`,
    completed: "Yarangiye",
    remaining: "Asigaye",
    days: "Iminsi",
    nextBadge: "Umudari ukurikira:",
    left: "asigaye",
    noHistory: "Nta masomo yarangiwe",
    noHistoryHint: "Tangira isomo ushaka, iterambere ryawe rizagaragara hano.",
    badgeEarned: "Warangije amasomo",
    keepGoing: "Komeza gutsinda!",
    firstBadge: "Rangira isomo rya mbere!",
    firstBadgeHint: "Uzahabwa umudari nyuma yo gutsinda isomo rimwe.",
    lessonHistoryTitle: "Amasomo Yarangiye",
    lessonHistoryRetryTitle: "Ongera ugerageze (urenze 80%)",
    retryButton: "Ongera Ugerageze",
    attempt: (n: number) => (n === 1 ? "ugerageze" : "ibigerageza"),
    ahoUgeze: "Aho ugeze",
    encouragement: (n: number) => `Warangije amasomo ${n}. Tangira irindi kugira ngo umenye byinshi.`,
  },

  // Profile
  profile: {
    loadError: "Ntabwo nashoboye kubona amakuru. Wongere kugerageza.",
    saveError: "Ntabwo nashoboye kubika. Wongere kugerageza.",
    saveSuccess: "Bika amakuru",
    selectProvince: "Hitamo intara",
    selectDistrict: "Hitamo akarere",
    selectSector: "Hitamo umurenge",
    agePlaceholder: "Urugero: 25",
  },

  // Report
  report: {
    title: "Impamyabushobozi Yanjye",
    subtitle: "Raporo ya MenyAI",
    share: "Sangira",
    shareMessage: (completed: number, total: number, badge: string, streak: number, avg: string) =>
      `📊 Raporo yanjye ya MenyAI\n\n✅ Amasomo yarangiye: ${completed}/${total}\n🏅 Umudari: ${badge}\n🔥 Streak: ${streak} iminsi\n🎯 Amanota hagati: ${avg}\n\nKomeza kwiga na MenyAI! 🇷🇼`,
    noBadge: "Nta mudari",
    comingSoon: "Amasomo Yarangiye Vuba",
  },

  // Home
  home: {
    greeting: (name?: string) => (name ? `Muraho, ${name}!` : "Muraho!"),
    encouragement: "Komeza kwiga neza",
    featuredLessonTitle: "Isomo Ryawe Rya None",
    startLesson: "Tangira Isomo",
    lessonsCompleted: "Amasomo Yarangiye",
    lessonsRemaining: "Amasomo Asigaye",
    lessonsCta: "Amasomo",
    quickActions: "Ibikorwa By'ibanze",
    viewAllLessons: "Reba amasomo yose akugenewe",
    viewProgress: "Reba aho ugejeje wiga",
    noFeaturedLesson: "Nta masomo ahari. Reba amasomo.",
    noFeaturedDescription: "Tangira isomo ushaka kugira ngo ube ubanza.",
  },

  // Practice
  practice: {
    resultPass: "Wakunze neza! Umeze ku wihangire!",
    resultFail: "Subira ugerageze. Urakwihangira neza!",
    backToPractice: "Subira ku Myitozo",
    retry: "Ongera Ugerageze",
    testKnowledge: "Gerageza ubumenyi bwawe mu Kinyarwanda",
  },

  // AI
  ai: {
    greeting: "Muraho! Ndi MenyAI, umufasha wawe. Ufite ikibazo cyangwa ukenera ubufasha kuri iri somo?",
    fallback: "Ntabwo nashoboye gusubiza ubu. Wongere none cyangwa injira kugira ngo ube na AI.",
  },

  // Levels / Learn
  levels: {
    selectLevel: "Hitamo icyiciro",
    title: "Amasomo",
    selectLevelCta: "Hitamo Icyiciro",
    choosePath: "Hitamo ikirenga ugitangira kuri",
  },

  // Misc
  common: {
    ok: "OK",
    error: "Byabuze",
    loading: "Tegereza...",
  },
} as const;
