import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Surah Data - All 114 Surahs of the Quran
// ──────────────────────────────────────────────
const surahs = [
    { number: 1, nameAr: 'الفاتحة', nameFr: 'Al-Fatiha', nameEn: 'The Opening', verseCount: 7, juz: 1, revelation: 'Meccan', difficulty: 1, order: 5 },
    { number: 2, nameAr: 'البقرة', nameFr: 'Al-Baqara', nameEn: 'The Cow', verseCount: 286, juz: 1, revelation: 'Medinan', difficulty: 5, order: 87 },
    { number: 3, nameAr: 'آل عمران', nameFr: 'Al-Imran', nameEn: 'The Family of Imran', verseCount: 200, juz: 3, revelation: 'Medinan', difficulty: 5, order: 89 },
    { number: 4, nameAr: 'النساء', nameFr: 'An-Nisa', nameEn: 'The Women', verseCount: 176, juz: 4, revelation: 'Medinan', difficulty: 5, order: 92 },
    { number: 5, nameAr: 'المائدة', nameFr: 'Al-Ma\'ida', nameEn: 'The Table Spread', verseCount: 120, juz: 6, revelation: 'Medinan', difficulty: 4, order: 112 },
    { number: 6, nameAr: 'الأنعام', nameFr: 'Al-An\'am', nameEn: 'The Cattle', verseCount: 165, juz: 7, revelation: 'Meccan', difficulty: 4, order: 55 },
    { number: 7, nameAr: 'الأعراف', nameFr: 'Al-A\'raf', nameEn: 'The Heights', verseCount: 206, juz: 8, revelation: 'Meccan', difficulty: 4, order: 39 },
    { number: 8, nameAr: 'الأنفال', nameFr: 'Al-Anfal', nameEn: 'The Spoils of War', verseCount: 75, juz: 9, revelation: 'Medinan', difficulty: 3, order: 88 },
    { number: 9, nameAr: 'التوبة', nameFr: 'At-Tawba', nameEn: 'The Repentance', verseCount: 129, juz: 10, revelation: 'Medinan', difficulty: 4, order: 113 },
    { number: 10, nameAr: 'يونس', nameFr: 'Yunus', nameEn: 'Jonah', verseCount: 109, juz: 11, revelation: 'Meccan', difficulty: 3, order: 51 },
    { number: 11, nameAr: 'هود', nameFr: 'Hud', nameEn: 'Hud', verseCount: 123, juz: 11, revelation: 'Meccan', difficulty: 3, order: 52 },
    { number: 12, nameAr: 'يوسف', nameFr: 'Yusuf', nameEn: 'Joseph', verseCount: 111, juz: 12, revelation: 'Meccan', difficulty: 3, order: 53 },
    { number: 13, nameAr: 'الرعد', nameFr: 'Ar-Ra\'d', nameEn: 'The Thunder', verseCount: 43, juz: 13, revelation: 'Medinan', difficulty: 3, order: 96 },
    { number: 14, nameAr: 'إبراهيم', nameFr: 'Ibrahim', nameEn: 'Abraham', verseCount: 52, juz: 13, revelation: 'Meccan', difficulty: 3, order: 72 },
    { number: 15, nameAr: 'الحجر', nameFr: 'Al-Hijr', nameEn: 'The Rocky Tract', verseCount: 99, juz: 14, revelation: 'Meccan', difficulty: 3, order: 54 },
    { number: 16, nameAr: 'النحل', nameFr: 'An-Nahl', nameEn: 'The Bee', verseCount: 128, juz: 14, revelation: 'Meccan', difficulty: 3, order: 70 },
    { number: 17, nameAr: 'الإسراء', nameFr: 'Al-Isra', nameEn: 'The Night Journey', verseCount: 111, juz: 15, revelation: 'Meccan', difficulty: 3, order: 50 },
    { number: 18, nameAr: 'الكهف', nameFr: 'Al-Kahf', nameEn: 'The Cave', verseCount: 110, juz: 15, revelation: 'Meccan', difficulty: 3, order: 69 },
    { number: 19, nameAr: 'مريم', nameFr: 'Maryam', nameEn: 'Mary', verseCount: 98, juz: 16, revelation: 'Meccan', difficulty: 3, order: 44 },
    { number: 20, nameAr: 'طه', nameFr: 'Ta-Ha', nameEn: 'Ta-Ha', verseCount: 135, juz: 16, revelation: 'Meccan', difficulty: 3, order: 45 },
    { number: 21, nameAr: 'الأنبياء', nameFr: 'Al-Anbiya', nameEn: 'The Prophets', verseCount: 112, juz: 17, revelation: 'Meccan', difficulty: 3, order: 73 },
    { number: 22, nameAr: 'الحج', nameFr: 'Al-Hajj', nameEn: 'The Pilgrimage', verseCount: 78, juz: 17, revelation: 'Medinan', difficulty: 3, order: 103 },
    { number: 23, nameAr: 'المؤمنون', nameFr: 'Al-Mu\'minun', nameEn: 'The Believers', verseCount: 118, juz: 18, revelation: 'Meccan', difficulty: 3, order: 74 },
    { number: 24, nameAr: 'النور', nameFr: 'An-Nur', nameEn: 'The Light', verseCount: 64, juz: 18, revelation: 'Medinan', difficulty: 3, order: 102 },
    { number: 25, nameAr: 'الفرقان', nameFr: 'Al-Furqan', nameEn: 'The Criterion', verseCount: 77, juz: 18, revelation: 'Meccan', difficulty: 3, order: 42 },
    { number: 26, nameAr: 'الشعراء', nameFr: 'Ash-Shu\'ara', nameEn: 'The Poets', verseCount: 227, juz: 19, revelation: 'Meccan', difficulty: 3, order: 47 },
    { number: 27, nameAr: 'النمل', nameFr: 'An-Naml', nameEn: 'The Ant', verseCount: 93, juz: 19, revelation: 'Meccan', difficulty: 3, order: 48 },
    { number: 28, nameAr: 'القصص', nameFr: 'Al-Qasas', nameEn: 'The Stories', verseCount: 88, juz: 20, revelation: 'Meccan', difficulty: 3, order: 49 },
    { number: 29, nameAr: 'العنكبوت', nameFr: 'Al-\'Ankabut', nameEn: 'The Spider', verseCount: 69, juz: 20, revelation: 'Meccan', difficulty: 3, order: 85 },
    { number: 30, nameAr: 'الروم', nameFr: 'Ar-Rum', nameEn: 'The Romans', verseCount: 60, juz: 21, revelation: 'Meccan', difficulty: 3, order: 84 },
    { number: 31, nameAr: 'لقمان', nameFr: 'Luqman', nameEn: 'Luqman', verseCount: 34, juz: 21, revelation: 'Meccan', difficulty: 2, order: 57 },
    { number: 32, nameAr: 'السجدة', nameFr: 'As-Sajda', nameEn: 'The Prostration', verseCount: 30, juz: 21, revelation: 'Meccan', difficulty: 2, order: 75 },
    { number: 33, nameAr: 'الأحزاب', nameFr: 'Al-Ahzab', nameEn: 'The Combined Forces', verseCount: 73, juz: 21, revelation: 'Medinan', difficulty: 3, order: 90 },
    { number: 34, nameAr: 'سبأ', nameFr: 'Saba', nameEn: 'Sheba', verseCount: 54, juz: 22, revelation: 'Meccan', difficulty: 3, order: 58 },
    { number: 35, nameAr: 'فاطر', nameFr: 'Fatir', nameEn: 'The Originator', verseCount: 45, juz: 22, revelation: 'Meccan', difficulty: 2, order: 43 },
    { number: 36, nameAr: 'يس', nameFr: 'Ya-Sin', nameEn: 'Ya-Sin', verseCount: 83, juz: 22, revelation: 'Meccan', difficulty: 3, order: 41 },
    { number: 37, nameAr: 'الصافات', nameFr: 'As-Saffat', nameEn: 'Those Who Set the Ranks', verseCount: 182, juz: 23, revelation: 'Meccan', difficulty: 3, order: 56 },
    { number: 38, nameAr: 'ص', nameFr: 'Sad', nameEn: 'Sad', verseCount: 88, juz: 23, revelation: 'Meccan', difficulty: 3, order: 38 },
    { number: 39, nameAr: 'الزمر', nameFr: 'Az-Zumar', nameEn: 'The Groups', verseCount: 75, juz: 23, revelation: 'Meccan', difficulty: 3, order: 59 },
    { number: 40, nameAr: 'غافر', nameFr: 'Ghafir', nameEn: 'The Forgiver', verseCount: 85, juz: 24, revelation: 'Meccan', difficulty: 3, order: 60 },
    { number: 41, nameAr: 'فصلت', nameFr: 'Fussilat', nameEn: 'Explained in Detail', verseCount: 54, juz: 24, revelation: 'Meccan', difficulty: 3, order: 61 },
    { number: 42, nameAr: 'الشورى', nameFr: 'Ash-Shura', nameEn: 'The Consultation', verseCount: 53, juz: 25, revelation: 'Meccan', difficulty: 3, order: 62 },
    { number: 43, nameAr: 'الزخرف', nameFr: 'Az-Zukhruf', nameEn: 'The Ornaments of Gold', verseCount: 89, juz: 25, revelation: 'Meccan', difficulty: 3, order: 63 },
    { number: 44, nameAr: 'الدخان', nameFr: 'Ad-Dukhan', nameEn: 'The Smoke', verseCount: 59, juz: 25, revelation: 'Meccan', difficulty: 3, order: 64 },
    { number: 45, nameAr: 'الجاثية', nameFr: 'Al-Jathiya', nameEn: 'The Crouching', verseCount: 37, juz: 25, revelation: 'Meccan', difficulty: 2, order: 65 },
    { number: 46, nameAr: 'الأحقاف', nameFr: 'Al-Ahqaf', nameEn: 'The Wind-Curved Sandhills', verseCount: 35, juz: 26, revelation: 'Meccan', difficulty: 2, order: 66 },
    { number: 47, nameAr: 'محمد', nameFr: 'Muhammad', nameEn: 'Muhammad', verseCount: 38, juz: 26, revelation: 'Medinan', difficulty: 2, order: 95 },
    { number: 48, nameAr: 'الفتح', nameFr: 'Al-Fath', nameEn: 'The Victory', verseCount: 29, juz: 26, revelation: 'Medinan', difficulty: 2, order: 111 },
    { number: 49, nameAr: 'الحجرات', nameFr: 'Al-Hujurat', nameEn: 'The Rooms', verseCount: 18, juz: 26, revelation: 'Medinan', difficulty: 2, order: 106 },
    { number: 50, nameAr: 'ق', nameFr: 'Qaf', nameEn: 'Qaf', verseCount: 45, juz: 26, revelation: 'Meccan', difficulty: 2, order: 34 },
    { number: 51, nameAr: 'الذاريات', nameFr: 'Adh-Dhariyat', nameEn: 'The Winnowing Winds', verseCount: 60, juz: 26, revelation: 'Meccan', difficulty: 2, order: 67 },
    { number: 52, nameAr: 'الطور', nameFr: 'At-Tur', nameEn: 'The Mount', verseCount: 49, juz: 27, revelation: 'Meccan', difficulty: 2, order: 76 },
    { number: 53, nameAr: 'النجم', nameFr: 'An-Najm', nameEn: 'The Star', verseCount: 62, juz: 27, revelation: 'Meccan', difficulty: 2, order: 23 },
    { number: 54, nameAr: 'القمر', nameFr: 'Al-Qamar', nameEn: 'The Moon', verseCount: 55, juz: 27, revelation: 'Meccan', difficulty: 2, order: 37 },
    { number: 55, nameAr: 'الرحمن', nameFr: 'Ar-Rahman', nameEn: 'The Beneficent', verseCount: 78, juz: 27, revelation: 'Medinan', difficulty: 2, order: 97 },
    { number: 56, nameAr: 'الواقعة', nameFr: 'Al-Waqi\'a', nameEn: 'The Inevitable', verseCount: 96, juz: 27, revelation: 'Meccan', difficulty: 2, order: 46 },
    { number: 57, nameAr: 'الحديد', nameFr: 'Al-Hadid', nameEn: 'The Iron', verseCount: 29, juz: 27, revelation: 'Medinan', difficulty: 2, order: 94 },
    { number: 58, nameAr: 'المجادلة', nameFr: 'Al-Mujadila', nameEn: 'The Pleading Woman', verseCount: 22, juz: 28, revelation: 'Medinan', difficulty: 2, order: 105 },
    { number: 59, nameAr: 'الحشر', nameFr: 'Al-Hashr', nameEn: 'The Exile', verseCount: 24, juz: 28, revelation: 'Medinan', difficulty: 2, order: 101 },
    { number: 60, nameAr: 'الممتحنة', nameFr: 'Al-Mumtahana', nameEn: 'She That Is to Be Examined', verseCount: 13, juz: 28, revelation: 'Medinan', difficulty: 2, order: 91 },
    { number: 61, nameAr: 'الصف', nameFr: 'As-Saf', nameEn: 'The Ranks', verseCount: 14, juz: 28, revelation: 'Medinan', difficulty: 2, order: 109 },
    { number: 62, nameAr: 'الجمعة', nameFr: 'Al-Jumu\'a', nameEn: 'Friday', verseCount: 11, juz: 28, revelation: 'Medinan', difficulty: 1, order: 110 },
    { number: 63, nameAr: 'المنافقون', nameFr: 'Al-Munafiqun', nameEn: 'The Hypocrites', verseCount: 11, juz: 28, revelation: 'Medinan', difficulty: 1, order: 104 },
    { number: 64, nameAr: 'التغابن', nameFr: 'At-Taghabun', nameEn: 'The Mutual Disillusion', verseCount: 18, juz: 28, revelation: 'Medinan', difficulty: 1, order: 108 },
    { number: 65, nameAr: 'الطلاق', nameFr: 'At-Talaq', nameEn: 'The Divorce', verseCount: 12, juz: 28, revelation: 'Medinan', difficulty: 2, order: 99 },
    { number: 66, nameAr: 'التحريم', nameFr: 'At-Tahrim', nameEn: 'The Prohibition', verseCount: 12, juz: 28, revelation: 'Medinan', difficulty: 2, order: 107 },
    { number: 67, nameAr: 'الملك', nameFr: 'Al-Mulk', nameEn: 'The Sovereignty', verseCount: 30, juz: 29, revelation: 'Meccan', difficulty: 2, order: 77 },
    { number: 68, nameAr: 'القلم', nameFr: 'Al-Qalam', nameEn: 'The Pen', verseCount: 52, juz: 29, revelation: 'Meccan', difficulty: 2, order: 2 },
    { number: 69, nameAr: 'الحاقة', nameFr: 'Al-Haaqqa', nameEn: 'The Reality', verseCount: 52, juz: 29, revelation: 'Meccan', difficulty: 2, order: 78 },
    { number: 70, nameAr: 'المعارج', nameFr: 'Al-Ma\'arij', nameEn: 'The Ascending Stairways', verseCount: 44, juz: 29, revelation: 'Meccan', difficulty: 2, order: 79 },
    { number: 71, nameAr: 'نوح', nameFr: 'Nuh', nameEn: 'Noah', verseCount: 28, juz: 29, revelation: 'Meccan', difficulty: 2, order: 71 },
    { number: 72, nameAr: 'الجن', nameFr: 'Al-Jinn', nameEn: 'The Jinn', verseCount: 28, juz: 29, revelation: 'Meccan', difficulty: 2, order: 40 },
    { number: 73, nameAr: 'المزمل', nameFr: 'Al-Muzzammil', nameEn: 'The Enshrouded One', verseCount: 20, juz: 29, revelation: 'Meccan', difficulty: 2, order: 3 },
    { number: 74, nameAr: 'المدثر', nameFr: 'Al-Muddaththir', nameEn: 'The Cloaked One', verseCount: 56, juz: 29, revelation: 'Meccan', difficulty: 2, order: 4 },
    { number: 75, nameAr: 'القيامة', nameFr: 'Al-Qiyama', nameEn: 'The Resurrection', verseCount: 40, juz: 29, revelation: 'Meccan', difficulty: 2, order: 31 },
    { number: 76, nameAr: 'الإنسان', nameFr: 'Al-Insan', nameEn: 'The Man', verseCount: 31, juz: 29, revelation: 'Medinan', difficulty: 2, order: 98 },
    { number: 77, nameAr: 'المرسلات', nameFr: 'Al-Mursalat', nameEn: 'The Emissaries', verseCount: 50, juz: 29, revelation: 'Meccan', difficulty: 2, order: 33 },
    { number: 78, nameAr: 'النبأ', nameFr: 'An-Naba', nameEn: 'The Tidings', verseCount: 40, juz: 30, revelation: 'Meccan', difficulty: 1, order: 80 },
    { number: 79, nameAr: 'النازعات', nameFr: 'An-Nazi\'at', nameEn: 'Those Who Drag Forth', verseCount: 46, juz: 30, revelation: 'Meccan', difficulty: 1, order: 81 },
    { number: 80, nameAr: 'عبس', nameFr: 'Abasa', nameEn: 'He Frowned', verseCount: 42, juz: 30, revelation: 'Meccan', difficulty: 1, order: 24 },
    { number: 81, nameAr: 'التكوير', nameFr: 'At-Takwir', nameEn: 'The Overthrowing', verseCount: 29, juz: 30, revelation: 'Meccan', difficulty: 1, order: 7 },
    { number: 82, nameAr: 'الانفطار', nameFr: 'Al-Infitar', nameEn: 'The Cleaving', verseCount: 19, juz: 30, revelation: 'Meccan', difficulty: 1, order: 82 },
    { number: 83, nameAr: 'المطففين', nameFr: 'Al-Mutaffifin', nameEn: 'The Defrauding', verseCount: 36, juz: 30, revelation: 'Meccan', difficulty: 1, order: 86 },
    { number: 84, nameAr: 'الانشقاق', nameFr: 'Al-Inshiqaq', nameEn: 'The Sundering', verseCount: 25, juz: 30, revelation: 'Meccan', difficulty: 1, order: 83 },
    { number: 85, nameAr: 'البروج', nameFr: 'Al-Buruj', nameEn: 'The Mansions of the Stars', verseCount: 22, juz: 30, revelation: 'Meccan', difficulty: 1, order: 27 },
    { number: 86, nameAr: 'الطارق', nameFr: 'At-Tariq', nameEn: 'The Morning Star', verseCount: 17, juz: 30, revelation: 'Meccan', difficulty: 1, order: 36 },
    { number: 87, nameAr: 'الأعلى', nameFr: 'Al-A\'la', nameEn: 'The Most High', verseCount: 19, juz: 30, revelation: 'Meccan', difficulty: 1, order: 8 },
    { number: 88, nameAr: 'الغاشية', nameFr: 'Al-Ghashiya', nameEn: 'The Overwhelming', verseCount: 26, juz: 30, revelation: 'Meccan', difficulty: 1, order: 68 },
    { number: 89, nameAr: 'الفجر', nameFr: 'Al-Fajr', nameEn: 'The Dawn', verseCount: 30, juz: 30, revelation: 'Meccan', difficulty: 1, order: 10 },
    { number: 90, nameAr: 'البلد', nameFr: 'Al-Balad', nameEn: 'The City', verseCount: 20, juz: 30, revelation: 'Meccan', difficulty: 1, order: 35 },
    { number: 91, nameAr: 'الشمس', nameFr: 'Ash-Shams', nameEn: 'The Sun', verseCount: 15, juz: 30, revelation: 'Meccan', difficulty: 1, order: 26 },
    { number: 92, nameAr: 'الليل', nameFr: 'Al-Layl', nameEn: 'The Night', verseCount: 21, juz: 30, revelation: 'Meccan', difficulty: 1, order: 10 },
    { number: 93, nameAr: 'الضحى', nameFr: 'Ad-Duha', nameEn: 'The Morning Hours', verseCount: 11, juz: 30, revelation: 'Meccan', difficulty: 1, order: 11 },
    { number: 94, nameAr: 'الشرح', nameFr: 'Ash-Sharh', nameEn: 'The Relief', verseCount: 8, juz: 30, revelation: 'Meccan', difficulty: 1, order: 12 },
    { number: 95, nameAr: 'التين', nameFr: 'At-Tin', nameEn: 'The Fig', verseCount: 8, juz: 30, revelation: 'Meccan', difficulty: 1, order: 28 },
    { number: 96, nameAr: 'العلق', nameFr: 'Al-\'Alaq', nameEn: 'The Clot', verseCount: 19, juz: 30, revelation: 'Meccan', difficulty: 1, order: 1 },
    { number: 97, nameAr: 'القدر', nameFr: 'Al-Qadr', nameEn: 'The Power', verseCount: 5, juz: 30, revelation: 'Meccan', difficulty: 1, order: 25 },
    { number: 98, nameAr: 'البينة', nameFr: 'Al-Bayyina', nameEn: 'The Clear Proof', verseCount: 8, juz: 30, revelation: 'Medinan', difficulty: 1, order: 100 },
    { number: 99, nameAr: 'الزلزلة', nameFr: 'Az-Zalzala', nameEn: 'The Earthquake', verseCount: 8, juz: 30, revelation: 'Medinan', difficulty: 1, order: 93 },
    { number: 100, nameAr: 'العاديات', nameFr: 'Al-\'Adiyat', nameEn: 'The Courser', verseCount: 11, juz: 30, revelation: 'Meccan', difficulty: 1, order: 14 },
    { number: 101, nameAr: 'القارعة', nameFr: 'Al-Qari\'a', nameEn: 'The Calamity', verseCount: 11, juz: 30, revelation: 'Meccan', difficulty: 1, order: 30 },
    { number: 102, nameAr: 'التكاثر', nameFr: 'At-Takathur', nameEn: 'The Rivalry in World Increase', verseCount: 8, juz: 30, revelation: 'Meccan', difficulty: 1, order: 16 },
    { number: 103, nameAr: 'العصر', nameFr: 'Al-\'Asr', nameEn: 'The Declining Day', verseCount: 3, juz: 30, revelation: 'Meccan', difficulty: 1, order: 13 },
    { number: 104, nameAr: 'الهمزة', nameFr: 'Al-Humaza', nameEn: 'The Traducer', verseCount: 9, juz: 30, revelation: 'Meccan', difficulty: 1, order: 32 },
    { number: 105, nameAr: 'الفيل', nameFr: 'Al-Fil', nameEn: 'The Elephant', verseCount: 5, juz: 30, revelation: 'Meccan', difficulty: 1, order: 19 },
    { number: 106, nameAr: 'قريش', nameFr: 'Quraysh', nameEn: 'Quraysh', verseCount: 4, juz: 30, revelation: 'Meccan', difficulty: 1, order: 29 },
    { number: 107, nameAr: 'الماعون', nameFr: 'Al-Ma\'un', nameEn: 'The Small Kindnesses', verseCount: 7, juz: 30, revelation: 'Meccan', difficulty: 1, order: 17 },
    { number: 108, nameAr: 'الكوثر', nameFr: 'Al-Kawthar', nameEn: 'The Abundance', verseCount: 3, juz: 30, revelation: 'Meccan', difficulty: 1, order: 15 },
    { number: 109, nameAr: 'الكافرون', nameFr: 'Al-Kafirun', nameEn: 'The Disbelievers', verseCount: 6, juz: 30, revelation: 'Meccan', difficulty: 1, order: 18 },
    { number: 110, nameAr: 'النصر', nameFr: 'An-Nasr', nameEn: 'The Divine Support', verseCount: 3, juz: 30, revelation: 'Medinan', difficulty: 1, order: 114 },
    { number: 111, nameAr: 'المسد', nameFr: 'Al-Masad', nameEn: 'The Palm Fibre', verseCount: 5, juz: 30, revelation: 'Meccan', difficulty: 1, order: 6 },
    { number: 112, nameAr: 'الإخلاص', nameFr: 'Al-Ikhlas', nameEn: 'Sincerity', verseCount: 4, juz: 30, revelation: 'Meccan', difficulty: 1, order: 22 },
    { number: 113, nameAr: 'الفلق', nameFr: 'Al-Falaq', nameEn: 'The Daybreak', verseCount: 5, juz: 30, revelation: 'Meccan', difficulty: 1, order: 20 },
    { number: 114, nameAr: 'الناس', nameFr: 'An-Nas', nameEn: 'Mankind', verseCount: 6, juz: 30, revelation: 'Meccan', difficulty: 1, order: 21 },
];

// ──────────────────────────────────────────────
// Badge Definitions
// ──────────────────────────────────────────────
const badges = [
    // Surah count milestones
    {
        name: 'First Surah',
        nameAr: 'أول سورة',
        description: 'Memorized your first Surah',
        descriptionAr: 'حفظت أول سورة',
        icon: '📖',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'surah_count', value: 1, rarity: 'common' }),
    },
    {
        name: 'Juz Amma Student',
        nameAr: 'طالب جزء عم',
        description: 'Memorized 10 Surahs',
        descriptionAr: 'حفظت 10 سور',
        icon: '🌟',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'surah_count', value: 10, rarity: 'common' }),
    },
    {
        name: 'Quarter Hafiz',
        nameAr: 'ربع حافظ',
        description: 'Memorized 30 Surahs',
        descriptionAr: 'حفظت 30 سورة',
        icon: '🏆',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'surah_count', value: 30, rarity: 'rare' }),
    },
    {
        name: 'Half Hafiz',
        nameAr: 'نصف حافظ',
        description: 'Memorized 57 Surahs',
        descriptionAr: 'حفظت 57 سورة',
        icon: '💎',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'surah_count', value: 57, rarity: 'epic' }),
    },
    {
        name: 'Hafiz ul Quran',
        nameAr: 'حافظ القرآن',
        description: 'Memorized all 114 Surahs of the Holy Quran',
        descriptionAr: 'حفظت جميع سور القرآن الكريم',
        icon: '👑',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'surah_count', value: 114, rarity: 'legendary' }),
    },
    // Streak badges
    {
        name: 'Week Warrior',
        nameAr: 'محارب الأسبوع',
        description: '7 day attendance streak',
        descriptionAr: '7 أيام حضور متواصلة',
        icon: '🔥',
        type: 'STREAK',
        criteria: JSON.stringify({ type: 'streak_days', value: 7, rarity: 'common' }),
    },
    {
        name: 'Month Master',
        nameAr: 'سيد الشهر',
        description: '30 day attendance streak',
        descriptionAr: '30 يوم حضور متواصلة',
        icon: '⚡',
        type: 'STREAK',
        criteria: JSON.stringify({ type: 'streak_days', value: 30, rarity: 'rare' }),
    },
    {
        name: 'Season Champion',
        nameAr: 'بطل الفصل',
        description: '90 day attendance streak',
        descriptionAr: '90 يوم حضور متواصلة',
        icon: '🌈',
        type: 'STREAK',
        criteria: JSON.stringify({ type: 'streak_days', value: 90, rarity: 'epic' }),
    },
    {
        name: 'Year Legend',
        nameAr: 'أسطورة السنة',
        description: '365 day attendance streak',
        descriptionAr: '365 يوم حضور متواصل',
        icon: '🎖️',
        type: 'STREAK',
        criteria: JSON.stringify({ type: 'streak_days', value: 365, rarity: 'legendary' }),
    },
    // Stars / evaluation badges
    {
        name: 'Rising Star',
        nameAr: 'نجم صاعد',
        description: 'Earned 10 stars in evaluations',
        descriptionAr: 'حصلت على 10 نجوم في التقييمات',
        icon: '⭐',
        type: 'EVALUATION',
        criteria: JSON.stringify({ type: 'total_stars', value: 10, rarity: 'common' }),
    },
    {
        name: 'Star Collector',
        nameAr: 'جامع النجوم',
        description: 'Earned 50 stars in evaluations',
        descriptionAr: 'حصلت على 50 نجمة في التقييمات',
        icon: '🌠',
        type: 'EVALUATION',
        criteria: JSON.stringify({ type: 'total_stars', value: 50, rarity: 'rare' }),
    },
    {
        name: 'Perfect Score',
        nameAr: 'علامة كاملة',
        description: 'Achieved a perfect score in an evaluation',
        descriptionAr: 'حصلت على علامة كاملة في تقييم',
        icon: '💯',
        type: 'EVALUATION',
        criteria: JSON.stringify({ type: 'perfect_score', value: 100, rarity: 'rare' }),
    },
    // Juz completion
    {
        name: 'Juz Complete',
        nameAr: 'جزء مكتمل',
        description: 'Completed memorization of a full Juz',
        descriptionAr: 'أكملت حفظ جزء كامل',
        icon: '📚',
        type: 'MEMORIZATION_MILESTONE',
        criteria: JSON.stringify({ type: 'juz_complete', value: 1, rarity: 'rare' }),
    },
    // Attendance badges
    {
        name: 'Perfect Attendance',
        nameAr: 'حضور مثالي',
        description: 'Attended all classes in a month',
        descriptionAr: 'حضرت جميع الحصص في شهر',
        icon: '✅',
        type: 'ATTENDANCE',
        criteria: JSON.stringify({ type: 'attendance', value: 'monthly_perfect', rarity: 'common' }),
    },
    {
        name: 'Dedicated Student',
        nameAr: 'طالب مجتهد',
        description: 'Perfect attendance for an entire semester',
        descriptionAr: 'حضور مثالي لفصل دراسي كامل',
        icon: '🎓',
        type: 'ATTENDANCE',
        criteria: JSON.stringify({ type: 'attendance', value: 'semester_perfect', rarity: 'epic' }),
    },
    {
        name: 'Special Achievement',
        nameAr: 'إنجاز خاص',
        description: 'Special recognition for outstanding performance',
        descriptionAr: 'تقدير خاص للأداء المتميز',
        icon: '🏅',
        type: 'SPECIAL',
        criteria: JSON.stringify({ type: 'special', value: 'outstanding', rarity: 'legendary' }),
    },
];

async function main() {
    console.log('🌱 Starting seed...');

    // ── Seed Badges ──
    console.log('Creating badges...');
    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { id: badge.name.toLowerCase().replace(/\s+/g, '-') },
            update: {},
            create: {
                id: badge.name.toLowerCase().replace(/\s+/g, '-'),
                ...badge,
            },
        });
    }
    console.log(`✅ Created ${badges.length} badges`);

    // ── Seed Admin User ──
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@antigravity.com' },
        update: {},
        create: {
            email: 'admin@antigravity.com',
            name: 'Admin User',
            password: adminPassword,
            role: 'ADMIN',
            locale: 'fr',
        },
    });
    await prisma.admin.upsert({
        where: { userId: adminUser.id },
        update: {},
        create: { userId: adminUser.id },
    });
    console.log('✅ Admin user created: admin@antigravity.com / Admin123!');

    // ── Seed Teacher User ──
    console.log('Creating teacher user...');
    const teacherPassword = await bcrypt.hash('Teacher123!', 12);
    const teacherUser = await prisma.user.upsert({
        where: { email: 'teacher@antigravity.com' },
        update: {},
        create: {
            email: 'teacher@antigravity.com',
            name: 'Mohammed Al-Sheikh',
            password: teacherPassword,
            role: 'TEACHER',
            locale: 'ar',
        },
    });
    const teacher = await prisma.teacher.upsert({
        where: { userId: teacherUser.id },
        update: {},
        create: {
            userId: teacherUser.id,
            speciality: 'Tajweed & Quran Memorization',
            bio: 'Experienced Quran teacher with 10 years of teaching Tajweed and memorization.',
        },
    });
    console.log('✅ Teacher user created: teacher@antigravity.com / Teacher123!');

    // ── Seed Parent User ──
    console.log('Creating parent user...');
    const parentPassword = await bcrypt.hash('Parent123!', 12);
    const parentUser = await prisma.user.upsert({
        where: { email: 'parent@antigravity.com' },
        update: {},
        create: {
            email: 'parent@antigravity.com',
            name: 'Ahmed Ben Ali',
            password: parentPassword,
            role: 'PARENT',
            locale: 'fr',
        },
    });
    const parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: {
            userId: parentUser.id,
            phone: '+1-514-555-0100',
        },
    });
    console.log('✅ Parent user created: parent@antigravity.com / Parent123!');

    // ── Seed Student User ──
    console.log('Creating student user...');
    const studentPassword = await bcrypt.hash('Student123!', 12);
    const studentUser = await prisma.user.upsert({
        where: { email: 'student@antigravity.com' },
        update: {},
        create: {
            email: 'student@antigravity.com',
            name: 'Yusuf Ben Ali',
            password: studentPassword,
            role: 'STUDENT',
            locale: 'fr',
        },
    });
    const student = await prisma.student.upsert({
        where: { userId: studentUser.id },
        update: {},
        create: {
            userId: studentUser.id,
            dateOfBirth: new Date('2012-03-15'),
            parents: {
                connect: [{ id: parent.id }],
            },
        },
    });
    console.log('✅ Student user created: student@antigravity.com / Student123!');

    // ── Create a Sample Group ──
    console.log('Creating sample group...');
    const group = await prisma.group.upsert({
        where: { id: 'sample-group-1' },
        update: {},
        create: {
            id: 'sample-group-1',
            name: 'Groupe Débutant A',
            description: 'Groupe pour les débutants en mémorisation du Coran',
            teacherId: teacher.id,
        },
    });

    // Connect student to group
    await prisma.student.update({
        where: { id: student.id },
        data: { groupId: group.id },
    });
    console.log('✅ Sample group created');

    // ── Add some Progress for the Student ──
    console.log('Adding sample progress...');
    const easyToMemorizeSurahs = surahs.filter(s => s.difficulty === 1).slice(0, 5);
    for (const surah of easyToMemorizeSurahs) {
        await prisma.progress.upsert({
            where: {
                studentId_surahNumber: {
                    studentId: student.id,
                    surahNumber: surah.number,
                },
            },
            update: {},
            create: {
                studentId: student.id,
                surahNumber: surah.number,
                surahName: surah.nameEn,
                versesTotal: surah.verseCount,
                versesMemorized: surah.verseCount,
                percentage: 100,
            },
        });
    }
    console.log('✅ Sample progress added for 5 surahs');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nAccounts created:');
    console.log('  Admin:   admin@antigravity.com / Admin123!');
    console.log('  Teacher: teacher@antigravity.com / Teacher123!');
    console.log('  Parent:  parent@antigravity.com / Parent123!');
    console.log('  Student: student@antigravity.com / Student123!');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
