export type SocialLink = {
  label: string;
  url: string;
};

export type SiteData = {
  locale: string;
  studioName: string;
  logoText: string;
  logoImage: string | null;
  header: {
    directorsLabel: string;
    aboutLabel: string;
    contactLabel: string;
  };
  contactPanel: {
    title: string;
    role: string;
    name: string;
    phone: string;
    email: string;
  };
  socialLinks: SocialLink[];
};

export type HomePageData = {
  heroVideoUrl: string;
  heroImage?: string | null;
  directorsLabel: string;
};

export type AboutPageData = {
  title: string;
  intro: string;
  paragraphs: string[];
  bottomImage: string | null;
  bottomImageAlt: string;
};

export type DirectorsPageData = {
  title: string;
  reelLabel: string;
  websiteLabel: string;
  heroBackgroundDesktop: string;
  heroBackgroundMobile: string;
  heroArrowImage: string | null;
  endingBackgroundDesktop: string;
  endingBackgroundMobile: string;
  endingSymbolImage: string | null;
  endingSymbolAlt: string;
};

export type DirectorProject = {
  id: string;
  title: string;
  videoUrl?: string;
  coverImage: string | null;
  coverImageAlt: string;
};

export type DirectorData = {
  slug: string;
  order: number;
  name: string;
  role: string;
  featuredProjectId?: string | null;
  bioTitle: string;
  bioParagraphs: string[];
  portrait: string | null;
  portraitAlt: string;
  socialLinks: SocialLink[];
  projects: DirectorProject[];
};
