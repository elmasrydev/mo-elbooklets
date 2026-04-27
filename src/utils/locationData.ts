export interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

export interface Governorate {
  id: string;
  name_ar: string;
  name_en: string;
  cities: City[];
}

export const EGYPT_LOCATIONS: Governorate[] = [
  {
    id: 'cairo',
    name_ar: 'القاهرة',
    name_en: 'Cairo',
    cities: [
      { id: 'nasr_city', name_ar: 'مدينة نصر', name_en: 'Nasr City' },
      { id: 'heliopolis', name_ar: 'مصر الجديدة', name_en: 'Heliopolis' },
      { id: 'maadi', name_ar: 'المعادي', name_en: 'Maadi' },
      { id: 'new_cairo', name_ar: 'القاهرة الجديدة', name_en: 'New Cairo' },
      { id: 'shubra', name_ar: 'شبرا', name_en: 'Shubra' },
    ],
  },
  {
    id: 'giza',
    name_ar: 'الجيزة',
    name_en: 'Giza',
    cities: [
      { id: '6th_october', name_ar: '6 أكتوبر', name_en: '6th of October' },
      { id: 'sheikh_zayed', name_ar: 'الشيخ زايد', name_en: 'Sheikh Zayed' },
      { id: 'haram', name_ar: 'الهرم', name_en: 'Haram' },
      { id: 'dokki', name_ar: 'الدقي', name_en: 'Dokki' },
      { id: 'mohandessin', name_ar: 'المهندسين', name_en: 'Mohandessin' },
    ],
  },
  {
    id: 'alexandria',
    name_ar: 'الإسكندرية',
    name_en: 'Alexandria',
    cities: [
      { id: 'smoha', name_ar: 'سموحة', name_en: 'Smoha' },
      { id: 'miami', name_ar: 'ميامي', name_en: 'Miami' },
      { id: 'agami', name_ar: 'العجمي', name_en: 'Agami' },
      { id: 'montaza', name_ar: 'المنتزه', name_en: 'Montaza' },
    ],
  },
  {
    id: 'qalyubia',
    name_ar: 'القليوبية',
    name_en: 'Qalyubia',
    cities: [
      { id: 'banha', name_ar: 'بنها', name_en: 'Banha' },
      { id: 'obour', name_ar: 'العبور', name_en: 'Obour' },
      { id: 'shubra_el_kheima', name_ar: 'شبرا الخيمة', name_en: 'Shubra El Kheima' },
    ],
  },
  {
    id: 'dakahlia',
    name_ar: 'الدقهلية',
    name_en: 'Dakahlia',
    cities: [
      { id: 'mansoura', name_ar: 'المنصورة', name_en: 'Mansoura' },
      { id: 'talkha', name_ar: 'طلخا', name_en: 'Talkha' },
    ],
  },
  // Add more as needed, but this covers the main ones for MVP
];
