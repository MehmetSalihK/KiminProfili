import { NextResponse } from 'next/server';
import axios from 'axios';
import { GameData, GoogleSearchResponse } from '@/app/types';

// Enforce dynamic behavior for this route
export const dynamic = 'force-dynamic';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

// --- Dictionaries & Maps ---

const COUNTRIES: Record<string, string> = {
  'TR': 'Türkiye', 'DE': 'Almanya', 'GB': 'Birleşik Krallık', 'US': 'Amerika Birleşik Devletleri',
  'FR': 'Fransa', 'RU': 'Rusya', 'BR': 'Brezilya', 'MX': 'Meksika', 'CN': 'Çin', 'IN': 'Hindistan',
  'IT': 'İtalya', 'ES': 'İspanya', 'CA': 'Kanada', 'AU': 'Avustralya', 'JP': 'Japonya',
  'NL': 'Hollanda', 'SE': 'İsveç', 'NO': 'Norveç', 'DK': 'Danimarka', 'FI': 'Finlandiya'
};

const JOBS = [
  { en: 'CEO', tr: 'Şirket Yöneticisi' },
  { en: 'Software Engineer', tr: 'Yazılım Mühendisi' },
  { en: 'Doctor', tr: 'Doktor' },
  { en: 'Nurse', tr: 'Hemşire' },
  { en: 'Pilot', tr: 'Pilot' },
  { en: 'Architect', tr: 'Mimar' },
  { en: 'Lawyer', tr: 'Avukat' },
  { en: 'Teacher', tr: 'Öğretmen' },
  { en: 'Chef', tr: 'Aşçı' },
  { en: 'Journalist', tr: 'Gazeteci' },
  { en: 'Driver', tr: 'Şoför' },
  { en: 'Artist', tr: 'Sanatçı' },
  { en: 'Accountant', tr: 'Muhasebeci' },
  { en: 'Consultant', tr: 'Danışman' },
];

function translateCrime(crime: string | undefined): string {
  if (!crime) return 'Aranıyor';
  
  const c = crime.toLowerCase().trim();

  // Specific Long Combinations first
  if (c.includes('leaving canada') && c.includes('terrorist')) return 'Terör örgütü faaliyeti amacıyla yurt dışına çıkış';
  if (c.includes('terrorist group') || c.includes('terrorist organization')) return 'Terör örgütü üyeliği veya yöneticiliği';
  if (c.includes('murder') && (c.includes('attemptED') || c.includes('attempted'))) return 'Kasten öldürmeye teşebbüs';
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
  if (c.includes('organized crime') || c.includes('criminal organization')) return 'Organize Suç Örgütü Üyeliği';
  if (c.includes('arson')) return 'Kundaklama';
  if (c.includes('extortion')) return 'Gasp / Haraç';
  
  // If no match but it's short, generic fallback
  if (crime.length < 20) return 'Ağır Ceza Suçu';

  // If long and unmatched, return original English (often better than wrong translation) 
  // or a slightly more detailed generic
  return 'Uluslararası Aranan Şahıs (Detaylar İngilizce): ' + crime;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Fetch Functions ---


async function fetchInterpolNotices(type: 'red' | 'yellow' | 'un' = 'red'): Promise<GameData | null> {
  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 12000); // 12s timeout
    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        next: { revalidate: 0 },
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notices: any[] = [];
    
    // Strategy 1: Targeted Country Search
    // We mix some random countries + major ones
    const countriesToTry = [
      getRandomItem(Object.keys(COUNTRIES)),
      'TR', 'US', 'FR', 'DE', 'GB', 'IT', 'ES', 'RU', 'CN', 'BR', 'IN'
    ];

    for (const country of countriesToTry) {
      if (notices.length > 0) break;
      
      try {
        console.log(`Trying Interpol ${type.toUpperCase()} Notices for: ${country}`);
        const res = await fetchWithTimeout(
          `https://ws-public.interpol.int/notices/v1/${type}?nationality=${country}&resultPerPage=200&page=1`
        );
        
        if (res.ok) {
          const data = await res.json();
          notices = data._embedded?.notices || [];
          if (notices.length > 0) {
            console.log(`✓ Found ${notices.length} ${type} notices for ${country}`);
            break;
          }
        }
      } catch (_error) {
        // Silent fail for individual country attempts
        continue;
      }
    }

    // Strategy 2: Global Search (if specific failed)
    if (notices.length === 0) {
      console.log(`Trying global Interpol ${type.toUpperCase()} search...`);
      try {
        const res = await fetchWithTimeout(
          `https://ws-public.interpol.int/notices/v1/${type}?resultPerPage=200`
        );
        if (res.ok) {
          const data = await res.json();
          notices = data._embedded?.notices || [];
          console.log(`Global search returned ${notices.length} notices`);
        }
      } catch (error) {
        console.error(`Global ${type} search failed:`, error);
      }
    }

    if (notices.length === 0) {
      console.warn(`No Interpol ${type} data available`);
      return null;
    }

    // Pick a random person
    const randomPerson = getRandomItem(notices);

    // Fetch Details
    let detailData = randomPerson;
    if (randomPerson._links?.self?.href) {
      try {
        const detailRes = await fetchWithTimeout(randomPerson._links.self.href);
        if (detailRes.ok) {
          detailData = await detailRes.json();
          console.log('✓ Fetched detailed profile');
        }
      } catch {
        console.warn('Using summary data (detail fetch failed)');
      }
    }

    return formatInterpolPerson(detailData, type);

  } catch (error) {
    console.error(`Interpol ${type} fetch error:`, error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatInterpolPerson(person: any, _type: 'red' | 'yellow' | 'un' = 'red'): GameData {
  // Use map or fallback
  // Person object from detail endpoint has slightly different structure than list item, but 'arrest_warrants' is key.
  
  let crime = '';
  if (person.arrest_warrants && person.arrest_warrants.length > 0) {
    crime = person.arrest_warrants[0].charge;
  }

  // Reason: Fallback if empty
  if (!crime) crime = 'Aranıyor';

  // Translate
  crime = translateCrime(crime);

  // Truncate if too long (although translateCrime usually returns short strings)


  const countryCode = person.nationalities && person.nationalities.length > 0 ? person.nationalities[0] : (person.country || 'TR');
  const countryName = COUNTRIES[countryCode] || countryCode;

  let photo = '';
  if (person._links?.thumbnail?.href) {
    photo = person._links.thumbnail.href;
  }

  return {
    type: 'INTERPOL',
    data: {
      fullName: `${person.forename || ''} ${person.name || ''}`.trim(),
      detail: crime,
      country: countryName,
      photoUrl: photo || 'https://placehold.co/400x400?text=No+Photo',
      realLink: `https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices#${person.entity_id ? person.entity_id.replace('/', '-') : ''}`
    }
  };
}
  


async function fetchLinkedInData(): Promise<GameData | null> {
    
    // Helper to get random user fallback
    const getRandomUserFallback = async (): Promise<GameData | null> => {
        try {
            console.log('Using RandomUser.me fallback for Professional data');
            const res = await axios.get('https://randomuser.me/api/?nat=tr,us,gb,de,fr');
            if (res.data.results && res.data.results.length > 0) {
                const user = res.data.results[0];
                const randomJob = getRandomItem(JOBS);
                const countryName = COUNTRIES[user.nat] || user.location.country;
                
                return {
                    type: 'LINKEDIN',
                    data: {
                        fullName: `${user.name.first} ${user.name.last}`,
                        detail: randomJob.tr,
                        country: countryName,
                        photoUrl: user.picture.large,
                        realLink: 'https://linkedin.com/' // Fake link since it's generated
                    }
                };
            }
        } catch (e) {
            console.error('RandomUser fallback failed:', e);
        }
        return null; 
    };

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.warn('Missing Google API Keys, switching to fallback');
        return getRandomUserFallback();
    }

    try {
        const randomJob = getRandomItem(JOBS);
        const query = `site:linkedin.com/in/ "${randomJob.en}"`;
        
        // Randomize start index to get different people
        const start = Math.floor(Math.random() * 10) * 10 + 1; // 1, 11, 21...

        const response = await axios.get<GoogleSearchResponse>('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: GOOGLE_API_KEY,
                cx: GOOGLE_CX,
                q: query,
                searchType: 'image', // Image search gives better faces? Or web search with pagemap?
                // Let's stick to normal search and look for pagemap images which are usually profile pics.
                // Wait, searchType='image' returns images directly but might be random images from the page.
                // Web search is safer for "Person" entities.
                start: start > 90 ? 1 : start, // Google limits deep paging
            }
        });

        if (!response.data.items || response.data.items.length === 0) throw new Error('No items');

        const itemsWithImage = response.data.items.filter(item => 
            item.pagemap?.cse_image && item.pagemap.cse_image.length > 0
        );

        if (itemsWithImage.length === 0) throw new Error('No images');

        const person = getRandomItem(itemsWithImage);
        const title = person.title.split('|')[0].replace(' - LinkedIn', '').trim(); // "John Doe - CEO"
        let name = title.split('-')[0].trim();
        // Sometimes title is just name, we can try to parse.
        
        // If name is too long, it might be junk.
        if (name.length > 30) name = "Linkedin Kullanıcısı";

        const photo = person.pagemap?.cse_image?.[0].src;
        
        // Map country? LinkedIn results often don't have country easily accessible in snippet.
        // We will randomize a "Safe" country or try to parse snippet if possible.
        // Let's just say "Türkiye" or a major country randomly for "Professional" context or "Dünya Vatandaşı"
        const randomSafeCountry = getRandomItem(['Türkiye', 'Almanya', 'Amerika', 'İngiltere', 'Hollanda']);

        return {
            type: 'LINKEDIN',
            data: {
                fullName: name,
                detail: randomJob.tr, // Use the job we searched for context, it matches the person roughly
                country: randomSafeCountry,
                photoUrl: photo || '',
                realLink: person.link
            }
        };

    } catch {
        console.warn('Google API unavailable, using fallback');
        return getRandomUserFallback();
    }
}



// --- Main Handler ---

export async function GET() {
  // Coin Toss
  const isInterpol = Math.random() < 0.5;

  let result: GameData | null = null;

  try { // Added try-catch for the whole GET function
    if (isInterpol) {
      // Try Red Notices first
      result = await fetchInterpolNotices('red');
      
      // Fallback to Yellow (Missing)
      if (!result) {
          console.log('Red notices failed, trying Yellow notices...');
          result = await fetchInterpolNotices('yellow');
      }
      
      // Fallback to UN (Sanctions)
      if (!result) {
          console.log('Yellow notices failed, trying UN notices...');
          result = await fetchInterpolNotices('un');
      }
    } else {
      result = await fetchLinkedInData();
    }

    // Cross-fallback
    if (!result && isInterpol) {
        result = await fetchLinkedInData(); 
    } else if (!result && !isInterpol) {
        // Try Red -> Yellow -> UN
        result = await fetchInterpolNotices('red');
        if (!result) result = await fetchInterpolNotices('yellow');
        if (!result) result = await fetchInterpolNotices('un');
    }


    if (!result) {
      return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch {
      return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
      );
  }
}
