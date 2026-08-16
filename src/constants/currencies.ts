export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',   name: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',     flag: '🇬🇧' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',    flag: '🇳🇬' },
  { code: 'GHS', symbol: '₵',   name: 'Ghanaian Cedi',     flag: '🇬🇭' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',   flag: '🇰🇪' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand',flag: '🇿🇦' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',   flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',      flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',      flag: '🇨🇳' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',       flag: '🇨🇭' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',        flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal',       flag: '🇸🇦' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',    flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',      flag: '🇲🇽' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',  flag: '🇸🇬' },
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona',     flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone',   flag: '🇳🇴' },
];

export const DEFAULT_CURRENCY: Currency = CURRENCIES[0]; // USD
