export interface CardItem {
  title: string;
  href: string;
  image: string;
  alt: string;
}

export const heroContent = {
  title: 'Reviews door Ilse',
  description:
    "In Ilse's Magazine vertel ik, Ilse, over mijn onderzoek dat ik heb gedaan naar producten voor in de tuin. Door mijn passie voor tuinieren, wilde ik weten wat de beste producten en innovatieve tuinier methode zijn. Dit presenteer ik in IlseMagazine in de vorm van top 10 lijstjes, blogs en nieuwsitems. Wanneer je hier zelf ook interesse in hebt, bekijk dan zeker mijn site en hopelijk kan ik je inspireren.",
  ctaLabel: 'Volgende topic',
  ctaHref: '#review',
  image: '/images/2022/Rectangle-1-1.png',
  imageAlt: 'Ilse in de tuin',
};

export const newsSection = {
  title: 'Laatste tuinier nieuwtjes',
  description:
    'Volg hier de recente ontwikkelingen in de hovenierswereld. De ontwikkelingen in deze bloeiende industrie volgen elkaar in rap tempo op, dus om bij te blijven met de laatste trends doe je er goed aan om op de hoogte te blijven. De belangrijkste inzichten vind je hieronder in de artikelen.',
  items: [
    {
      title: 'Takkenscharen',
      href: '/beste-takkenschaar/',
      image: '/images/elementor/takkenschaar.jpg',
      alt: 'Takkenschaar',
    },
    {
      title: 'Zwenksproeiers',
      href: '/beste-zwenksproeier/',
      image: '/images/elementor/sproeier-tuin.jpg',
      alt: 'Sproeier tuin',
    },
    {
      title: 'Plantenrekken',
      href: '/beste-plantenrek/',
      image: '/images/elementor/planten-rek.jpg',
      alt: 'Planten rek',
    },
  ] satisfies CardItem[],
};

export const aboutSection = {
  title: 'Ilse',
  subtitle: 'IlseMagazine.nl',
  description:
    'Mijn passie voor tuinieren is al vroeg ontstaan. Op de basisschool hadden we een eigen moestuin waar we veel projecten deden. Het idee om prachtige producten te creëren vanuit de natuur zoals groente en fruit, sprak mij erg aan en daar wilde ik iets mee doen. Nu heb ik mijn eigen tuintje in een volkstuin bij mij in de buurt waar ik al mijn creaties tot uitvoer kan brengen. Daarnaast heb ik deze site om mijn onderzoek te presenteren en zodoende hopelijk andere tuinierliefhebbers te helpen met het onderhoud van hun tuin.',
  image: '/images/2022/Rectangle-1-1.png',
  imageAlt: 'Ilse',
};

export const householdSection = {
  title: 'Praktische huishoudproducten',
  description:
    'Ontdek onmisbare producten die zorgen voor orde, gemak en efficiëntie in huis. Van een ruime kledingkast tot een betrouwbare wasmachine en een handig strijkplan voor dagelijks comfort.',
  items: [
    {
      title: 'Kledingkast kinderkamer',
      href: '/beste-kledingkast-kinderkamer/',
      image: '/images/2023/KLEDINGKAST-KINDERKAMER.jpg',
      alt: 'Kledingkast kinderkamer',
    },
    {
      title: 'Matrassen 180x200',
      href: '/beste-matras-180x200/',
      image: '/images/2025/bedroom.jpg',
      alt: 'Bedroom',
    },
    {
      title: 'Wasmachine en droger in 1',
      href: '/beste-wasmachine-en-droger-in-1/',
      image: '/images/2023/wereldkaart.jpg',
      alt: 'Wasmachine en droger',
    },
    {
      title: 'Stoomreiniger vloer',
      href: '/beste-stoomreiniger-vloer/',
      image: '/images/2023/stoomreiniger-vloer.jpg',
      alt: 'Stoomreiniger vloer',
    },
    {
      title: 'Strijkplank voor stoomstrijkijzer',
      href: '/beste-strijkplank-voor-stoomstrijkijzer/',
      image: '/images/2023/strijkplank-voor-stroomstrijkijzer.jpg',
      alt: 'Strijkplank voor stoomstrijkijzer',
    },
    {
      title: 'Slowcooker met timer',
      href: '/beste-slowcooker-met-timer/',
      image: '/images/2023/slowcooker-met-timer.jpg',
      alt: 'Slowcooker met timer',
    },
  ] satisfies CardItem[],
};

export const reviewsSection = {
  title: 'Reviews',
  description:
    'De uitkomst van mijn onderzoek komt tot uiting in top 10 lijstjes van een uitgebreid aanbod aan producten voor in de tuin. Om een indruk te krijgen van welke producten ik gereviewd heb, vind je hieronder alvast een beknopt overzicht.',
  items: [
    {
      title: 'Opvouwbare wasmand',
      href: '/beste-opvouwbare-wasmand/',
      image: '/images/elementor/wasmanden.jpg',
      alt: 'Opvouwbare wasmand',
    },
    {
      title: 'Wekker kind',
      href: '/beste-wekker-kind/',
      image: '/images/2025/alarm-klok.jpg',
      alt: 'Wekker kind',
    },
    {
      title: 'Droogrek muur',
      href: '/beste-droogrek-muur/',
      image: '/images/elementor/droogrek.jpg',
      alt: 'Droogrek muur',
    },
  ] satisfies CardItem[],
};
