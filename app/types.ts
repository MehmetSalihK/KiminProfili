export type SourceType = 'INTERPOL' | 'LINKEDIN';

export interface GameData {
  type: SourceType;
  data: {
    fullName: string;
    detail: string; // Turkish Translated Job or Crime
    country: string; // Turkish Translated Country
    photoUrl: string;
    realLink: string;
  };
}

export type InterpolResponse = {
  _embedded: {
    notices: Array<{
      forename: string;
      name: string;
      entity_id: string;
      _links: {
        self: { href: string };
        images: { href: string };
        thumbnail: { href: string };
      };
    }>;
  };
};

export type GoogleSearchResponse = {
  items: Array<{
    title: string;
    link: string;
    pagemap?: {
      cse_image?: Array<{ src: string }>;
      person?: Array<{ name: string; role: string }>;
    };
  }>;
};
