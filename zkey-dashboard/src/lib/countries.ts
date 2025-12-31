export interface Country {
    name: string;
    code: string;
    country: string;
}

export const countries: Country[] = [
    { name: 'United States', code: '+1', country: 'US' },
    { name: 'United Kingdom', code: '+44', country: 'GB' },
    { name: 'Spain', code: '+34', country: 'ES' },
    { name: 'United Arab Emirates', code: '+971', country: 'AE' },
    { name: 'Saudi Arabia', code: '+966', country: 'SA' },
    { name: 'Qatar', code: '+974', country: 'QA' },
    { name: 'France', code: '+33', country: 'FR' },
    { name: 'Germany', code: '+49', country: 'DE' },
    { name: 'Italy', code: '+39', country: 'IT' },
    { name: 'Portugal', code: '+351', country: 'PT' },
    { name: 'Andorra', code: '+376', country: 'AD' },
    { name: 'Mexico', code: '+52', country: 'MX' },
    { name: 'Argentina', code: '+54', country: 'AR' },
    { name: 'Colombia', code: '+57', country: 'CO' },
    { name: 'Chile', code: '+56', country: 'CL' },
    { name: 'Peru', code: '+51', country: 'PE' },
    { name: 'Brazil', code: '+55', country: 'BR' },
    { name: 'Canada', code: '+1', country: 'CA' },
    { name: 'Australia', code: '+61', country: 'AU' },
    { name: 'Singapore', code: '+65', country: 'SG' },
    { name: 'Japan', code: '+81', country: 'JP' },
    { name: 'South Korea', code: '+82', country: 'KR' },
    { name: 'China', code: '+86', country: 'CN' },
    { name: 'India', code: '+91', country: 'IN' },
    { name: 'Turkey', code: '+90', country: 'TR' },
    { name: 'South Africa', code: '+27', country: 'ZA' },
    { name: 'Nigeria', code: '+234', country: 'NG' },
    { name: 'Egypt', code: '+20', country: 'EG' },
].sort((a, b) => a.name.localeCompare(b.name));
