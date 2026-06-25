export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const mainNavigation: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Tuin',
    href: '/tuin/',
    children: [
      { label: 'Solar tuinverlichting', href: '/beste-solar-tuinverlichting/' },
      { label: 'Buitendouche', href: '/beste-buitendouche/' },
      { label: 'Tuinkussen', href: '/beste-tuinkussen/' },
      { label: 'Loungeset', href: '/beste-loungeset/' },
      { label: 'Tuinstoel', href: '/beste-tuinstoel/' },
      { label: 'Tuinbank', href: '/beste-tuinbank/' },
      { label: 'Hangmat', href: '/beste-hangmat/' },
      { label: 'Tuintafel', href: '/beste-tuintafel/' },
      { label: 'Parasol', href: '/beste-parasol/' },
      { label: 'Tuinset', href: '/beste-tuinset/' },
    ],
  },
  {
    label: 'Tuingereedschap',
    href: '/tuingereedschap/',
    children: [
      { label: 'Snoeigereedschap', href: '/beste-snoeigereedschap/' },
      { label: 'Hogedrukreiniger', href: '/beste-hogedrukreiniger/' },
      { label: 'Onkruidbrander', href: '/beste-onkruidbrander/' },
      { label: 'Heggenschaar', href: '/beste-heggenschaar/' },
      { label: 'Veegmachine', href: '/beste-veegmachine/' },
      { label: 'Buxusschaar', href: '/beste-buxusschaar/' },
      { label: 'Grastrimmer', href: '/beste-grastrimmer/' },
      { label: 'Grasmaaier', href: '/beste-grasmaaier/' },
      { label: 'Kooimaaier', href: '/beste-kooimaaier/' },
      { label: 'Bladblazer', href: '/beste-bladblazer/' },
    ],
  },
  {
    label: 'Tuindecoratie',
    href: '/tuindecoratie/',
    children: [
      { label: 'Vijverdecoratie', href: '/beste-vijverdecoratie/' },
      { label: 'Insectenhotel', href: '/beste-insectenhotel/' },
      { label: 'Buitenkleed', href: '/beste-buitenkleed/' },
      { label: 'Rozenboog', href: '/beste-rozenboog/' },
      { label: 'Tuinkleding', href: '/beste-tuinkleding/' },
      { label: 'Windmolen', href: '/beste-windmolen/' },
      { label: 'Terrasvijver', href: '/beste-terrasvijver/' },
      { label: 'Tuinkussen', href: '/beste-tuinkussen/' },
      { label: 'Windgong', href: '/beste-windgong/' },
      { label: 'Tuinbeeld', href: '/beste-tuinbeeld/' },
    ],
  },
  { label: 'Contact', href: '/contact/' },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' as const },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' as const },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' as const },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' as const },
];
