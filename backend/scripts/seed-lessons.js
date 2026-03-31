/**
 * MenyAI – Complete Curriculum Seed Script
 * Populates Firestore with 30 Kinyarwanda lessons across 4 modules.
 *
 * Usage: node scripts/seed-lessons.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { initFirebase, getDb } = require("../config/firebase");

initFirebase();

const LESSONS = [
    // ─────────────────────────────────────────────────────────────
    // MODULE 1: IMIRONGO (Lines & Strokes) — 5 lessons
    // ─────────────────────────────────────────────────────────────
    {
        order: 1, module: "Imirongo", moduleColor: "#4CAF78",
        title: "Imirongo Yegeranye",
        subtitle: "Imirongo yegeranye",
        description: "Wige gukora imirongo yegeranye (horizontal) neza, hifashishijwe inzira nziza zo kwandika.",
        duration: "8 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni ikihe gikoresho gikoreshwa mu gukora imirongo?", correctAnswer: "Ikaramu", options: ["Ikaramu", "Ingohe", "Inzira", "Ikaye"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura umurongo yegeranye mu Kinyarwanda:", correctAnswer: "yegeranye" },
            { id: "a3", type: "mc", question: "Imirongo yegeranye igenda ute?", correctAnswer: "Ibumoso kugeza iburyo", options: ["Ibumoso kugeza iburyo", "Hejuru kugeza hasi", "Igitama", "Inziga"] },
        ]
    },
    {
        order: 2, module: "Imirongo", moduleColor: "#4CAF78",
        title: "Imirongo Ihagarara",
        subtitle: "Imirongo ihagarara",
        description: "Wige gukora imirongo ihagarara (vertical), kuva hejuru ugashika hasi, neza kandi nta kutabara.",
        duration: "8 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Imirongo ihagarara igenda ute?", correctAnswer: "Hejuru kugeza hasi", options: ["Hejuru kugeza hasi", "Ibumoso kugeza iburyo", "Igitama", "Inziga"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura umurongo uhagarara mu Kinyarwanda:", correctAnswer: "uhagarara" },
            { id: "a3", type: "mc", question: "Mu nyuguti 'I', ni imirongo bingahe ihagarara?", correctAnswer: "Umwe", options: ["Umwe", "Ebyiri", "Eshatu", "Ine"] },
        ]
    },
    {
        order: 3, module: "Imirongo", moduleColor: "#4CAF78",
        title: "Imirongo y'Igitama",
        subtitle: "Imirongo y'igitama",
        description: "Wige gukora imirongo y'igitama (oblique) — igenda mu rugendo rw'igitama, bikenera ubuhanga.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Imirongo y'igitama isa nk'iki?", correctAnswer: "Urugendo rwa /", options: ["Urugendo rwa /", "Umurongo uhagarara |", "Umurongo yegeranye —", "Inziga O"] },
            { id: "a2", type: "mc", question: "Mu nyuguti 'A', imirongo y'igitama ni ingahe?", correctAnswer: "Ebyiri", options: ["Imwe", "Ebyiri", "Eshatu", "Ine"] },
            { id: "a3", type: "typing", prompt: "Andika ijambo risobanura umurongo w'igitama mu Kinyarwanda:", correctAnswer: "igitama" },
        ]
    },
    {
        order: 4, module: "Imirongo", moduleColor: "#4CAF78",
        title: "Imirongo Inziga",
        subtitle: "Imirongo inziga",
        description: "Wige gukora imirongo inziga (curved), zikora urwunge nko mu nyuguti 'C', 'O', 'S'.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni ikihe cyitwa imirongo inziga?", correctAnswer: "Umurongo ucana urwunge", options: ["Umurongo ucana urwunge", "Umurongo uhagarara", "Umurongo yegeranye", "Umurongo w'igitama"] },
            { id: "a2", type: "mc", question: "Ni irihe jambo rigira imirongo inziga hafi yose?", correctAnswer: "O", options: ["O", "L", "T", "V"] },
            { id: "a3", type: "typing", prompt: "Andika inyuguti ebyiri zigira umurongo inziga:", correctAnswer: "C O" },
        ]
    },
    {
        order: 5, module: "Imirongo", moduleColor: "#4CAF78",
        title: "Guhuza Imirongo",
        subtitle: "Guhuza imirongo",
        description: "Guhuza imirongo yose: yegeranye, ihagarara, y'igitama, n'inziga kugirango ushobore gukora inyuguti.",
        duration: "12 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Inyuguti 'H' igizwe n'imirongo ingahe?", correctAnswer: "Eshatu", options: ["Ebyiri", "Eshatu", "Ine", "Imwe"] },
            { id: "a2", type: "mc", question: "Inyuguti 'T' igizwe n'imirongo ingahe?", correctAnswer: "Ebyiri", options: ["Imwe", "Ebyiri", "Eshatu", "Ine"] },
            { id: "a3", type: "mc", question: "Inyuguti 'X' igizwe n'imirongo ingahe?", correctAnswer: "Ebyiri", options: ["Imwe", "Ebyiri", "Eshatu", "Ine"] },
            { id: "a4", type: "typing", prompt: "Andika inyuguti igizwe n'imirongo ihagarara imwe n'inziga:", correctAnswer: "D" },
        ]
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 2: INYUGUTI (Letters) — 8 lessons
    // ─────────────────────────────────────────────────────────────
    {
        order: 6, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Inyajwi: A, E, I, O, U",
        subtitle: "Inyajwi",
        description: "Wige inyajwi eshanu z'Ikinyarwanda: A, E, I, O, U. Zose ziravugwa zicari imwe.",
        duration: "12 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni izihe inyajwi (vowels) mu Kinyarwanda?", correctAnswer: "A E I O U", options: ["A E I O U", "B C D F G", "M N P R S", "H J K L Q"] },
            { id: "a2", type: "typing", prompt: "Andika inyajwi eshanu zose mu Kinyarwanda:", correctAnswer: "A E I O U" },
            { id: "a3", type: "mc", question: "Ni irihe jambo rishingiye kuri inyajwi 'A'?", correctAnswer: "Amata", options: ["Amata", "Bakuru", "Cifuzo", "Dore"] },
            { id: "a4", type: "mc", question: "Mu ijambo 'INZU', inyajwi ni izihe?", correctAnswer: "I na U", options: ["I na U", "N na Z", "I na Z", "N na U"] },
        ]
    },
    {
        order: 7, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Inkonsonanti: B, D, G, K",
        subtitle: "Inkonsonanti (itsinda 1)",
        description: "Wige inkonsonanti enye: B, D, G, K — uko zivugwa kandi uko zikoreshwa mu magambo.",
        duration: "12 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni irihe jambo ritangira na 'B'?", correctAnswer: "Bakuru", options: ["Bakuru", "Amata", "Inzu", "Umuntu"] },
            { id: "a2", type: "mc", question: "Ni irihe jambo ritangira na 'K'?", correctAnswer: "Keza", options: ["Dore", "Gato", "Keza", "Bakora"] },
            { id: "a3", type: "typing", prompt: "Andika inyuguti irangira ijambo 'INKA':", correctAnswer: "A" },
            { id: "a4", type: "mc", question: "Ni ikihe gice cy'ijambo 'GATO' gitangira na 'G'?", correctAnswer: "Gato ritangira na G", options: ["Gato ritangira na G", "Gato ritangira na A", "Gato ritangira na T", "Gato ritangira na O"] },
        ]
    },
    {
        order: 8, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Inkonsonanti: M, N, R, S",
        subtitle: "Inkonsonanti (itsinda 2)",
        description: "Wige inkonsonanti: M, N, R, S. Zikunda gukoreshwa cyane mu Kinyarwanda.",
        duration: "12 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "typing", prompt: "Andika inyuguti itangira ijambo 'MANA':", correctAnswer: "M" },
            { id: "a2", type: "mc", question: "Ni irihe jambo ritangira na 'N'?", correctAnswer: "Neza", options: ["Neza", "Mama", "Reba", "Sura"] },
            { id: "a3", type: "mc", question: "Ni irihe jambo rirangira na 'R' mu Kinyarwanda?", correctAnswer: "Umuryango", options: ["Inzu", "Umuryango", "Amata", "Bakuru"] },
            { id: "a4", type: "typing", prompt: "Andika inyuguti itangira ijambo 'SOMA':", correctAnswer: "S" },
        ]
    },
    {
        order: 9, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Inkonsonanti: F, H, J, L",
        subtitle: "Inkonsonanti (itsinda 3)",
        description: "Wige inkonsonanti: F, H, J, L. Ziraboneka mu magambo menshi y'Ikinyarwanda.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni irihe jambo ritangira na 'H'?", correctAnswer: "Hafi", options: ["Hafi", "Fata", "Jya", "Leka"] },
            { id: "a2", type: "typing", prompt: "Andika inyuguti itangira ijambo 'FATA':", correctAnswer: "F" },
            { id: "a3", type: "mc", question: "Ni irihe jambo ritangira na 'J'?", correctAnswer: "Jya", options: ["Jya", "Hafi", "Fata", "Leka"] },
        ]
    },
    {
        order: 10, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Inkonsonanti: P, T, V, W, Y, Z",
        subtitle: "Inkonsonanti (itsinda 4)",
        description: "Wige inkonsonanti zo mu isonga: P, T, V, W, Y, Z.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni irihe jambo ritangira na 'T'?", correctAnswer: "Tanga", options: ["Tanga", "Pata", "Vura", "Wita"] },
            { id: "a2", type: "typing", prompt: "Andika inyuguti itangira ijambo 'YIGA':", correctAnswer: "Y" },
            { id: "a3", type: "mc", question: "Inkonsonanti 'Z' ikoreshwa hehe?", correctAnswer: "Mu ntangiriro y'amagambo", options: ["Mu ntangiriro y'amagambo", "Ntabwo ikoreshwa", "Mu nyajwi gusa", "Irangiza gusa amagambo"] },
            { id: "a4", type: "typing", prompt: "Andika ijambo rimwe ritangira na 'Z' mu Kinyarwanda:", correctAnswer: "zaramo" },
        ]
    },
    {
        order: 11, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Ibyondo: Ma–Me–Mi–Mo–Mu",
        subtitle: "Ibyondo bya M",
        description: "Wige ibyondo by'inyuguti 'M': Ma, Me, Mi, Mo, Mu — kuyavuga no kuyandika.",
        duration: "12 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni ikihe gice cy'ijambo 'MAMA'?", correctAnswer: "Ma + Ma", options: ["Ma + Ma", "Me + Mi", "Mo + Mu", "Mi + Ma"] },
            { id: "a2", type: "typing", prompt: "Andika uko uvuga: M + O =", correctAnswer: "Mo" },
            { id: "a3", type: "mc", question: "Mu ijambo 'IMIRIMO', ibyondo biri ari ibihe?", correctAnswer: "I + Mi + ri + Mo", options: ["I + Mi + ri + Mo", "Im + ir + im + o", "I + miri + mo", "Imir + imo"] },
        ]
    },
    {
        order: 12, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Amagambo 2 Ibyondo",
        subtitle: "Amagambo abiri ibyondo",
        description: "Wige gusoma no kwandika amagambo agizwe n'ibyondo bibiri: IN-ZU, A-MA-TA, etc.",
        duration: "14 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ijambo 'INZU' rigizwe n'ibyondo bingahe?", correctAnswer: "Ebyiri", options: ["Imwe", "Ebyiri", "Eshatu", "Ine"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura 'aho utuye' mu Kinyarwanda:", correctAnswer: "inzu" },
            { id: "a3", type: "mc", question: "Ni irihe jambo rigizwe n'ibyondo ebyiri?", correctAnswer: "MAMA", options: ["MAMA", "UMUNTU", "AMAGAMBO", "ITERAMBERE"] },
            { id: "a4", type: "typing", prompt: "Andika ijambo risobanura 'abantu b'imfura':", correctAnswer: "abana" },
        ]
    },
    {
        order: 13, module: "Inyuguti", moduleColor: "#3B82F6",
        title: "Interuro Ngufi",
        subtitle: "Interuro ngufi",
        description: "Wige gusoma no kwandika interuro ngufi z'Ikinyarwanda nk'uko bavuga muri rusange.",
        duration: "15 min", level: "2", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "typing", prompt: "Andika interuro ngufi: 'Ndi muri ___' (aho uri)", correctAnswer: "Ndi muri inzu" },
            { id: "a2", type: "mc", question: "Ni irihe jambo rishobora gufungura interuro?", correctAnswer: "Ndi", options: ["Ndi", "INZU", "MU", "NA"] },
            { id: "a3", type: "mc", question: "Interuro 'Mama arima' isobanura iki?", correctAnswer: "Mama akora imirima", options: ["Mama akora imirima", "Mama arara", "Mama aryama", "Mama arira"] },
            { id: "a4", type: "typing", prompt: "Andika interuro ngufi isobanura ko ufite inzu nziza:", correctAnswer: "Mfite inzu nziza" },
        ]
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 3: IMIBARE (Numbers & Math) — 10 lessons
    // ─────────────────────────────────────────────────────────────
    {
        order: 14, module: "Imibare", moduleColor: "#F59E0B",
        title: "Imibare 1 kugeza 5",
        subtitle: "Imibare 1 kugeza 5",
        description: "Wige ku mibare 1 kugeza 5 mu Kinyarwanda: Imwe, Ebyiri, Eshatu, Ine, Eshanu.",
        duration: "10 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni iyihe nimero ivugwa ngo 'EBYIRI'?", correctAnswer: "2", options: ["1", "2", "3", "4"] },
            { id: "a2", type: "typing", prompt: "Andika mu magambo nimero '3' mu Kinyarwanda:", correctAnswer: "eshatu" },
            { id: "a3", type: "mc", question: "'ESHANU' ni nimero iyihe?", correctAnswer: "5", options: ["3", "4", "5", "6"] },
            { id: "a4", type: "typing", prompt: "Andika nimero '1' mu Kinyarwanda:", correctAnswer: "imwe" },
        ]
    },
    {
        order: 15, module: "Imibare", moduleColor: "#F59E0B",
        title: "Imibare 6 kugeza 10",
        subtitle: "Imibare 6 kugeza 10",
        description: "Wige imibare 6 kugeza 10: Gatandatu, Karindwi, Umunani, Icyenda, Icumi.",
        duration: "10 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni iyihe nimero ivugwa ngo 'ICUMI'?", correctAnswer: "10", options: ["7", "8", "9", "10"] },
            { id: "a2", type: "typing", prompt: "Andika mu magambo nimero '7':", correctAnswer: "karindwi" },
            { id: "a3", type: "mc", question: "'UMUNANI' ni nimero iyihe?", correctAnswer: "8", options: ["6", "7", "8", "9"] },
            { id: "a4", type: "typing", prompt: "Andika mu magambo nimero '6':", correctAnswer: "gatandatu" },
        ]
    },
    {
        order: 16, module: "Imibare", moduleColor: "#F59E0B",
        title: "Imibare 11 kugeza 20",
        subtitle: "Imibare 11 kugeza 20",
        description: "Wige imibare 11–20: Icumi n'imwe, Icumi na ebyiri, ..., Makumyabiri.",
        duration: "12 min", level: "2", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "'MAKUMYABIRI' ni nimero iyihe?", correctAnswer: "20", options: ["15", "18", "19", "20"] },
            { id: "a2", type: "typing", prompt: "Andika mu magambo nimero '11':", correctAnswer: "icumi n'imwe" },
            { id: "a3", type: "mc", question: "Nimero 15 ivugwa ite mu Kinyarwanda?", correctAnswer: "Icumi n'eshanu", options: ["Icumi na gatandatu", "Icumi n'eshanu", "Icumi na karindwi", "Icumi n'umunani"] },
        ]
    },
    {
        order: 17, module: "Imibare", moduleColor: "#F59E0B",
        title: "Kongeranya 1–5",
        subtitle: "Kongeranya kugeza 5",
        description: "Wige kongeranya imibare micye (1 kugeza 5): 1+1=2, 2+2=4, 3+2=5, nk'ibyo.",
        duration: "12 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "2 + 2 =?", correctAnswer: "4", options: ["2", "3", "4", "5"] },
            { id: "a2", type: "typing", prompt: "Bara: 3 + 2 = ?", correctAnswer: "5" },
            { id: "a3", type: "mc", question: "1 + 4 =?", correctAnswer: "5", options: ["3", "4", "5", "6"] },
            { id: "a4", type: "typing", prompt: "Kongeranya: 2 + 1 = ?", correctAnswer: "3" },
        ]
    },
    {
        order: 18, module: "Imibare", moduleColor: "#F59E0B",
        title: "Kongeranya 6–10",
        subtitle: "Kongeranya kugeza 10",
        description: "Wige kongeranya imibare irusha (6–10): 5+5=10, 4+6=10, 3+7=10, nk'ibyo.",
        duration: "12 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "5 + 5 =?", correctAnswer: "10", options: ["8", "9", "10", "11"] },
            { id: "a2", type: "typing", prompt: "Bara: 4 + 6 = ?", correctAnswer: "10" },
            { id: "a3", type: "mc", question: "3 + 7 =?", correctAnswer: "10", options: ["9", "10", "11", "12"] },
            { id: "a4", type: "typing", prompt: "Kongeranya: 6 + 2 = ?", correctAnswer: "8" },
        ]
    },
    {
        order: 19, module: "Imibare", moduleColor: "#F59E0B",
        title: "Kuvanaho Ngufi",
        subtitle: "Kuvanaho ngufi",
        description: "Wige kuvanaho: 5-2=3, 10-5=5. Mubara ntabwo tugesha, ahubwo tugabanya.",
        duration: "12 min", level: "2", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "5 - 2 =?", correctAnswer: "3", options: ["2", "3", "4", "5"] },
            { id: "a2", type: "typing", prompt: "Bara: 10 - 5 = ?", correctAnswer: "5" },
            { id: "a3", type: "mc", question: "8 - 3 =?", correctAnswer: "5", options: ["4", "5", "6", "7"] },
            { id: "a4", type: "typing", prompt: "Vanaho: 9 - 4 = ?", correctAnswer: "5" },
        ]
    },
    {
        order: 20, module: "Imibare", moduleColor: "#F59E0B",
        title: "Kubara Ibintu",
        subtitle: "Kubara ibintu",
        description: "Wige kubara ibintu byagaragarira amaso: inka, inzu, abantu, n'ibindi.",
        duration: "10 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ufite 3 amagi, urongeye 2, ufite ingahe?", correctAnswer: "5", options: ["3", "4", "5", "6"] },
            { id: "a2", type: "typing", prompt: "Ufite inka 4, imwe yavutse. Ufite inka zingahe?", correctAnswer: "5" },
            { id: "a3", type: "mc", question: "Mu ishuri hari abana 10, 3 bavuye. Basigaye bangahe?", correctAnswer: "7", options: ["5", "6", "7", "8"] },
        ]
    },
    {
        order: 21, module: "Imibare", moduleColor: "#F59E0B",
        title: "Gukoza (×)",
        subtitle: "Gukoza (×)",
        description: "Tangira kwiga gukoza (×): 2×3=6, 3×3=9. Gukoza ni kongeranya bwa kabiri.",
        duration: "15 min", level: "3", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "2 × 3 =?", correctAnswer: "6", options: ["4", "5", "6", "7"] },
            { id: "a2", type: "typing", prompt: "Bara: 3 × 3 = ?", correctAnswer: "9" },
            { id: "a3", type: "mc", question: "4 × 2 =?", correctAnswer: "8", options: ["6", "7", "8", "9"] },
            { id: "a4", type: "typing", prompt: "Koza: 5 × 2 = ?", correctAnswer: "10" },
        ]
    },
    {
        order: 22, module: "Imibare", moduleColor: "#F59E0B",
        title: "Kugabanya (÷)",
        subtitle: "Kugabanya (÷)",
        description: "Wige kugabanya (÷): 6÷2=3, 10÷5=2. Kugabanya ni gutanya ibihezo mu migabane ingana.",
        duration: "15 min", level: "3", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "6 ÷ 2 =?", correctAnswer: "3", options: ["2", "3", "4", "5"] },
            { id: "a2", type: "typing", prompt: "Bara: 10 ÷ 5 = ?", correctAnswer: "2" },
            { id: "a3", type: "mc", question: "8 ÷ 4 =?", correctAnswer: "2", options: ["1", "2", "3", "4"] },
            { id: "a4", type: "typing", prompt: "Gabanya: 9 ÷ 3 = ?", correctAnswer: "3" },
        ]
    },
    {
        order: 23, module: "Imibare", moduleColor: "#F59E0B",
        title: "Ibibazo by'Imibare",
        subtitle: "Ibibazo by'imibare",
        description: "Ibibazo bihwanye byose: kongeranya, kuvanaho, gukoza, kugabanya. Subiramo wose.",
        duration: "20 min", level: "3", difficulty: "Advanced", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "(2 + 3) × 2 =?", correctAnswer: "10", options: ["7", "8", "9", "10"] },
            { id: "a2", type: "typing", prompt: "Bara: (10 - 4) ÷ 2 = ?", correctAnswer: "3" },
            { id: "a3", type: "mc", question: "3 × 3 - 4 =?", correctAnswer: "5", options: ["4", "5", "6", "7"] },
            { id: "a4", type: "typing", prompt: "Bara: 4 + 2 × 3 = ?", correctAnswer: "10" },
        ]
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 4: IMISHUSHO & AMABARA (Shapes, Colors, Sizes) — 7 lessons
    // ─────────────────────────────────────────────────────────────
    {
        order: 24, module: "Imishusho", moduleColor: "#EC4899",
        title: "Umuzingo",
        subtitle: "Umuzingo",
        description: "Wige gusobanukirwa umuzingo (circle): imirongo yose igera ku kigo kimwe, isa nk'iyeri.",
        duration: "8 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Umuzingo ufite amabonga angahe?", correctAnswer: "Nta mabonga", options: ["Nta mabonga", "Ebyiri", "Eshatu", "Ine"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura umuzingo mu Kinyarwanda:", correctAnswer: "umuzingo" },
            { id: "a3", type: "mc", question: "Ni ikihe cyasa na umuzingo?", correctAnswer: "Iyeri", options: ["Iyeri", "Sanduku", "Igihanga", "Inzoka"] },
        ]
    },
    {
        order: 25, module: "Imishusho", moduleColor: "#EC4899",
        title: "Inderugihe na Kasali",
        subtitle: "Inderugihe n'isanduku",
        description: "Wige gucanga inderugihe (rectangle) n'isanduku (square): zombi zigira ibonga bine.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Inderugihe igira ibonga bingahe?", correctAnswer: "Ine", options: ["Ebyiri", "Eshatu", "Ine", "Eshanu"] },
            { id: "a2", type: "mc", question: "Isanduku (square) isa nk'iki?", correctAnswer: "Inzira enye zingana", options: ["Inzira enye zingana", "Inzira ebyiri zingana", "Umuzingo", "Urutonde"] },
            { id: "a3", type: "typing", prompt: "Andika ijambo risobanura isanduku mu Kinyarwanda:", correctAnswer: "isanduku" },
        ]
    },
    {
        order: 26, module: "Imishusho", moduleColor: "#EC4899",
        title: "Urutonde",
        subtitle: "Urutonde",
        description: "Wige gusobanukirwa urutonde (triangle): ufite inzinziri eshatu n'ibonga eshatu.",
        duration: "8 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Urutonde ugira ibonga bingahe?", correctAnswer: "Eshatu", options: ["Ebyiri", "Eshatu", "Ine", "Eshanu"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura urutonde mu Kinyarwanda:", correctAnswer: "urutonde" },
            { id: "a3", type: "mc", question: "Ni ikihe cyasa na urutonde muri kamere?", correctAnswer: "Umusozi", options: ["Umusozi", "Iyeri", "Inzira", "Sanduku"] },
        ]
    },
    {
        order: 27, module: "Imishusho", moduleColor: "#EC4899",
        title: "Imishusho Yindi",
        subtitle: "Imishusho yindi",
        description: "Wige imishusho irushaho: meza eshanu (pentagon), meza itandatu (hexagon), n'izindi.",
        duration: "12 min", level: "2", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ishusho ifite ibonga bitanu yitwa iki ku Cyongereza?", correctAnswer: "Pentagon", options: ["Pentagon", "Hexagon", "Octagon", "Triangle"] },
            { id: "a2", type: "mc", question: "Ishusho y'ubushi (honeycomb) ifite ibonga bingahe?", correctAnswer: "Gatandatu", options: ["Ine", "Eshanu", "Gatandatu", "Karindwi"] },
            { id: "a3", type: "typing", prompt: "Andika ijambo ku Cyongereza risobanura 'ishusho ifite ibonga icumi n'ebyiri':", correctAnswer: "dodecagon" },
        ]
    },
    {
        order: 28, module: "Imishusho", moduleColor: "#EC4899",
        title: "Amabara y'Ibanze",
        subtitle: "Amabara y'ibanze",
        description: "Wige amabara y'ibanze mu Kinyarwanda: Umutuku, Ubururu, Icyatsi, Umweru, n'ibindi.",
        duration: "10 min", level: "1", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "'Umutuku' ni iki?", correctAnswer: "Ibara ry'umutuku", options: ["Ibara ry'umutuku", "Ibara ry'ubururu", "Ibara ry'icyatsi", "Ibara ry'umuhondo"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo mu Kinyarwanda risobanura 'Green':", correctAnswer: "icyatsi" },
            { id: "a3", type: "mc", question: "Umugozi w'ibarwa ni irihe bara?", correctAnswer: "Umuhondo", options: ["Umutuku", "Ubururu", "Umuhondo", "Umweru"] },
            { id: "a4", type: "typing", prompt: "Andika ijambo mu Kinyarwanda risobanura 'Blue':", correctAnswer: "ubururu" },
        ]
    },
    {
        order: 29, module: "Imishusho", moduleColor: "#EC4899",
        title: "Ingano z'Ibintu",
        subtitle: "Ingano n'igigereranyo",
        description: "Wige gusesengura ingano z'ibintu: Nini, Ngufi, Gifu, Mbibi, n'ibindi.",
        duration: "10 min", level: "2", difficulty: "Beginner", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Ni ikihe kivugwa ngo 'nini'?", correctAnswer: "Nini cyangwa gikaze", options: ["Nini cyangwa gikaze", "Ngufi cyangwa gito", "Gifite uburebure", "Gito"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo mu Kinyarwanda risobanura 'gito' cyangwa 'ngufi':", correctAnswer: "ngufi" },
            { id: "a3", type: "mc", question: "Inzu nini n'inzu ngufi: iyihe inini?", correctAnswer: "Inzu nini", options: ["Inzu nini", "Inzu ngufi", "Zingana", "Ntibiboneka"] },
        ]
    },
    {
        order: 30, module: "Imishusho", moduleColor: "#EC4899",
        title: "Imbere n'Inyuma",
        subtitle: "Imbere n'inyuma",
        description: "Wige amagambo y'aho ibintu biri: Imbere, Inyuma, Hejuru, Hasi, Ibumoso, Iburyo.",
        duration: "12 min", level: "2", difficulty: "Intermediate", enabled: true,
        videoUrl: "",
        activities: [
            { id: "a1", type: "mc", question: "Igisambu kiri inyuma y'inzu. 'Inyuma' bivuga iki?", correctAnswer: "Inyuma", options: ["Inyuma", "Imbere", "Hejuru", "Hasi"] },
            { id: "a2", type: "typing", prompt: "Andika ijambo risobanura aho imodoka iri hagati y'inzira ebyiri:", correctAnswer: "hagati" },
            { id: "a3", type: "mc", question: "Ikirere kiri hejuru yacu. 'Hejuru' bivuga iki?", correctAnswer: "Hejuru", options: ["Hejuru", "Hasi", "Ibumoso", "Iburyo"] },
            { id: "a4", type: "mc", question: "Ni ahe 'ibumoso' bivuga?", correctAnswer: "Ibumoso", options: ["Ibumoso", "Iburyo", "Imbere", "Inyuma"] },
        ]
    },
];

/** Export for update script; run seed when executed directly */
async function seed() {
    const db = getDb();
    if (!db) {
        console.error("❌ Firebase not initialized. Check backend/.env");
        process.exit(1);
    }

    console.log(`🌱 Seeding ${LESSONS.length} lessons to Firestore...`);

    const batch = db.batch();
    for (const lesson of LESSONS) {
        const ref = db.collection("lessons").doc(); // auto ID
        batch.set(ref, {
            ...lesson,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ Queued: [${lesson.order}] ${lesson.title}`);
    }

    await batch.commit();
    console.log(`\n🎉 Done! ${LESSONS.length} lessons seeded successfully.`);
    process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}

module.exports = { LESSONS };
