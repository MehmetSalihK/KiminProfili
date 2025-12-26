import axios from 'axios';
import { GameData } from './types';

// --- Constants ---

const COUNTRIES: Record<string, string> = {
  'TR': 'Türkiye', 'DE': 'Almanya', 'GB': 'Birleşik Krallık', 'US': 'Amerika Birleşik Devletleri',
  'FR': 'Fransa', 'RU': 'Rusya', 'BR': 'Brezilya', 'MX': 'Meksika', 'CN': 'Çin', 'IN': 'Hindistan',
  'IT': 'İtalya', 'ES': 'İspanya', 'CA': 'Kanada', 'AU': 'Avustralya', 'JP': 'Japonya',
  'NL': 'Hollanda', 'SE': 'İsveç', 'NO': 'Norveç', 'DK': 'Danimarka', 'FI': 'Finlandiya'
};

const FALLBACK_CRIMES = [
    'Kasten Öldürme', 'Uyuşturucu Madde Ticareti', 'Silahlı Soygun', 
    'Nitelikli Dolandırıcılık', 'Terör Örgütü Üyeliği', 'İnsan Kaçakçılığı', 
    'Bilişim Sistemleri Aracılığıyla Hırsızlık', 'Kara Para Aklama',
    'Organize Suç Örgütü Yöneticiliği', 'Casusluk'
];

// --- Helpers ---

function ensureHttps(url: string): string {
  if (!url) return '';
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function translateCrime(crime: string | undefined): string {
  if (!crime) return 'Aranıyor';
  
  const c = crime.toLowerCase().trim();

  // Specific Long Combinations first
  if (c.includes('leaving canada') && c.includes('terrorist')) return 'Terör örgütü faaliyeti amacıyla yurt dışına çıkış';
  if (c.includes('terrorist group') || c.includes('terrorist organization')) return 'Terör örgütü üyeliği veya yöneticiliği';
  if (c.includes('murder') && (c.includes('attempted'))) return 'Kasten öldürmeye teşebbüs';
  if (c.includes('asesinato') && (c.includes('tentativa'))) return 'Kasten öldürmeye teşebbüs'; // Spanish attempt
  if (c.includes('trafficking') && c.includes('human')) return 'İnsan kaçakçılığı';
  if (c.includes('trata') && c.includes('seres humanos')) return 'İnsan kaçakçılığı'; // Spanish human trafficking
  if (c.includes('sexual') && c.includes('child')) return 'Çocuğun cinsel istismarı';
  
  // General Categories (English, Spanish, French)
  
  // Murder / Cinayet
  if (c.includes('murder') || c.includes('kill') || c.includes('homicide') || c.includes('manslaughter') || 
      c.includes('asesinato') || c.includes('homicidio') || c.includes('matar') || 
      c.includes('meurtre') || c.includes('assassinat')) return 'Cinayet / Kasten Öldürme';

  // Drugs / Uyuşturucu
  if (c.includes('drug') || c.includes('narcotic') || c.includes('cocaine') || c.includes('cannabis') || c.includes('psychotropic') ||
      c.includes('droga') || c.includes('tráfico') || c.includes('trafico') || c.includes('cocaína') || c.includes('estupefacientes') ||
      c.includes('stupéfiants') || c.includes('drogue')) return 'Uyuşturucu Madde Ticareti';

  // Fraud / Dolandırıcılık
  if (c.includes('fraud') || c.includes('laundering') || c.includes('financial') || c.includes('embezzlement') || c.includes('swindling') ||
      c.includes('estafa') || c.includes('lavado') || c.includes('fraude') || c.includes('blanqueo') ||
      c.includes('escroquerie') || c.includes('blanchiment')) return 'Dolandırıcılık ve Mali Suçlar';

  // Theft / Hırsızlık
  if (c.includes('robbery') || c.includes('theft') || c.includes('burglary') || c.includes('larceny') || c.includes('stealing') ||
      c.includes('robo') || c.includes('hurto') || c.includes('latrocinio') ||
      c.includes('vol')) return 'Hırsızlık ve Soygun';

  // Terror / Terör
  if (c.includes('terror')) return 'Terör Örgütü Faaliyetleri';

  // Sexual / Cinsel
  if (c.includes('rape') || c.includes('sexual') || c.includes('abuse') ||
      c.includes('violación') || c.includes('violacion') || c.includes('abuso sexual') ||
      c.includes('viol') || c.includes('sexuelle')) return 'Cinsel Saldırı / İstismar';

  // Kidnapping / Kaçırma
  if (c.includes('kidnap') || c.includes('abduction') ||
      c.includes('secuestro') || c.includes('rapto') || c.includes('detención ilegal') ||
      c.includes('enlèvement') || c.includes('sequestration')) return 'Adam Kaçırma / Kişiyi Hürriyetinden Yoksun Kılma';

  // Assault / Yaralama
  if (c.includes('assault') || c.includes('injury') || c.includes('wound') ||
      c.includes('lesiones') || c.includes('heridas') || c.includes('agresión') ||
      c.includes('violence') || c.includes('blessures')) return 'Kasten Yaralama / Darp';

  // Arms / Silah
  if (c.includes('weapon') || c.includes('firearm') || c.includes('arms') ||
      c.includes('armas') || c.includes('ilícita de armas') ||
      c.includes('armes')) return 'Yasadışı Silah Ticareti';

  // Counterfeit / Sahtecilik
  if (c.includes('counterfeit') || c.includes('forgery') ||
      c.includes('falsificación') || c.includes('falsificacion') ||
      c.includes('contrefaçon')) return 'Sahtecilik';

  // Smuggling / Kaçakçılık
  if (c.includes('smuggling') || c.includes('contrabando') || c.includes('contrabande')) return 'Kaçakçılık';

  return (crime.length > 50) ? 'Aranıyor (Detaylar Gizli)' : crime;
}

// --- Logic ---

// Simulated Fallback
const getRandomInterpolFallbackClient = async (): Promise<GameData | null> => {
    try {
        console.log('Client: Using Simulated Interpol Fallback');
        const res = await axios.get('https://randomuser.me/api/?nat=tr,us,gb,de,fr,ru,br', { timeout: 3000 });
        if (res.data.results && res.data.results.length > 0) {
            const user = res.data.results[0];
            const countryName = COUNTRIES[user.nat] || user.location.country;
            const randomCrime = getRandomItem(FALLBACK_CRIMES);

            return {
                type: 'INTERPOL',
                data: {
                    fullName: `${user.name.first} ${user.name.last}`,
                    detail: randomCrime,
                    country: countryName,
                    photoUrl: ensureHttps(user.picture.large),
                    realLink: 'https://interpol.int/'
                }
            };
        }
    } catch (e) {
        console.error('Client: Simulated fallback failed', e);
    }
    return null;
};

// Interpol Interface
interface InterpolNotice {
  entity_id?: string;
  forename?: string;
  name?: string;
  _links?: {
    self?: { href: string };
    thumbnail?: { href: string };
  };
  arrest_warrants?: { charge: string }[];
  country_of_birth_id?: string;
}

// Real Client-Side Fetch
export async function fetchInterpolFrontend(): Promise<GameData | null> {
    try {
        let notices: InterpolNotice[] = [];
        const type = 'red';
        
        // Optimize: Try only ONE random country to save time, then fallback to global.
        const randomCountry = getRandomItem(Object.keys(COUNTRIES));

        // 1. Specific Country
        try {
            console.log(`Client: Fetching Interpol for ${randomCountry}`);
            const res = await axios.get(`https://ws-public.interpol.int/notices/v1/${type}?nationality=${randomCountry}&resultPerPage=200&page=1`, { timeout: 4000 });
            if (res.data._embedded?.notices) {
                notices = res.data._embedded.notices;
            }
        } catch { 
            // Silent fail
        }

        // 2. Global if failed
        if (notices.length === 0) {
             try {
                console.log('Client: Fetching Global Interpol');
                const res = await axios.get(`https://ws-public.interpol.int/notices/v1/${type}?resultPerPage=200`, { timeout: 4000 });
                if (res.data._embedded?.notices) {
                    notices = res.data._embedded.notices;
                }
             } catch (e) { 
                 console.warn('Client: Global fetch failed', e); 
             }
        }

        if (notices.length === 0) {
            console.warn('Client: No notices found, using fallback');
            return getRandomInterpolFallbackClient();
        }

        // Pick random person
        const person = getRandomItem(notices);
        
        // Fetch Details (Self Link)
        let detailData: InterpolNotice = person;
        if (person._links?.self?.href) {
            try {
                const detailRes = await axios.get(person._links.self.href, { timeout: 4000 });
                detailData = detailRes.data;
            } catch { 
                console.warn('Client: Detail fetch failed, using summary data'); 
            }
        }

        // Format
        let crime = '';
        if (detailData.arrest_warrants && detailData.arrest_warrants.length > 0) {
            crime = detailData.arrest_warrants[0].charge;
        }
        
        const photo = person._links?.thumbnail?.href || detailData._links?.thumbnail?.href;

        return {
            type: 'INTERPOL',
            data: {
                fullName: `${detailData.forename || ''} ${detailData.name || ''}`.trim(),
                detail: translateCrime(crime),
                country: detailData.country_of_birth_id || 'Bilinmiyor',
                photoUrl: ensureHttps(photo || ''),
                realLink: `https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices#${person.entity_id ? person.entity_id.replace('/', '-') : ''}`
            }
        };

    } catch (error) {
        console.error('Client: Interpol fetch error', error);
        return getRandomInterpolFallbackClient();
    }
}


// --- Offline / Static Fallback (Nuclear Option) ---
const STATIC_NAMES = [
    'Ahmet Yılmaz', 'Mehmet Demir', 'Ayşe Kaya', 'Fatma Çelik', 'Mustafa Şahin', 
    'Zeynep Yıldız', 'Emre Öztürk', 'Elif Arslan', 'Burak Doğan', 'Selin Aydın'
];
const STATIC_PHOTOS = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/85.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/men/22.jpg',
    'https://randomuser.me/api/portraits/women/12.jpg'
];

export function getOfflineFallback(): GameData {
    console.warn('Client: Activating OFFLINE MODE (Nuclear Fallback)');
    const name = getRandomItem(STATIC_NAMES);
    const photo = getRandomItem(STATIC_PHOTOS);
    const country = getRandomItem(['Türkiye', 'Almanya', 'Fransa', 'Amerika', 'İngiltere']);
    
    // 50/50 Chance
    if (Math.random() < 0.5) {
        // Interpol
        const crime = getRandomItem(FALLBACK_CRIMES);
        return {
            type: 'INTERPOL',
            data: {
                fullName: name,
                detail: crime,
                country: country,
                photoUrl: photo,
                realLink: 'https://interpol.int'
            }
        };
    } else {
        // LinkedIn
        const safeJobs = ['Yazılım Mühendisi', 'Satış Danışmanı', 'İK Uzmanı', 'Grafik Tasarımcı', 'Öğretmen', 'Mimar', 'Doktor'];
        return {
            type: 'LINKEDIN',
            data: {
                fullName: name,
                detail: getRandomItem(safeJobs),
                country: country,
                photoUrl: photo,
                realLink: 'https://linkedin.com'
            }
        };
    }
}
