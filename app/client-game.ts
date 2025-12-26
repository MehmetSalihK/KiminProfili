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
  if (c.includes('trafficking') && c.includes('human')) return 'İnsan kaçakçılığı';
  if (c.includes('sexual') && c.includes('child')) return 'Çocuğun cinsel istismarı';
  
  // General Categories
  if (c.includes('murder') || c.includes('kill') || c.includes('homicide') || c.includes('manslaughter')) return 'Cinayet / Kasten Öldürme';
  if (c.includes('drug') || c.includes('narcotic') || c.includes('cocaine') || c.includes('cannabis') || c.includes('psychotropic')) return 'Uyuşturucu Madde Ticareti';
  if (c.includes('fraud') || c.includes('laundering') || c.includes('financial') || c.includes('embezzlement') || c.includes('swindling')) return 'Dolandırıcılık ve Mali Suçlar';
  if (c.includes('robbery') || c.includes('theft') || c.includes('burglary') || c.includes('larceny') || c.includes('stealing')) return 'Hırsızlık ve Soygun';
  if (c.includes('terror')) return 'Terör Örgütü Faaliyetleri';
  if (c.includes('rape') || c.includes('sexual') || c.includes('abuse')) return 'Cinsel Saldırı / İstismar';
  if (c.includes('kidnap') || c.includes('abduction')) return 'Adam Kaçırma / Kişiyi Hürriyetinden Yoksun Kılma';
  if (c.includes('assault') || c.includes('injury') || c.includes('wound')) return 'Kasten Yaralama / Darp';
  if (c.includes('weapon') || c.includes('firearm') || c.includes('arms')) return 'Yasadışı Silah Ticareti';
  if (c.includes('counterfeit') || c.includes('forgery')) return 'Sahtecilik';
  if (c.includes('smuggling')) return 'Kaçakçılık';

  return 'Aranıyor';
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
