export interface VenezuelanBank {
  code: string;
  name: string;
  type: string;
}

export const VENEZUELAN_BANKS: VenezuelanBank[] = [
  { code: '0102', name: 'Banco de Venezuela', type: 'Universal' },
  { code: '0104', name: 'Venezolano de Crédito', type: 'Universal' },
  { code: '0105', name: 'Banco Mercantil', type: 'Universal' },
  { code: '0108', name: 'BBVA Provincial', type: 'Universal' },
  { code: '0114', name: 'Bancaribe', type: 'Universal' },
  { code: '0115', name: 'Banco Exterior', type: 'Universal' },
  { code: '0128', name: 'Banco Caroní', type: 'Universal' },
  { code: '0134', name: 'Banesco', type: 'Universal' },
  { code: '0138', name: 'Mibanco', type: 'Comercial' },
  { code: '0146', name: 'Bangente', type: 'Microfinanzas' },
  { code: '0151', name: 'BFC Banco Fondo Común', type: 'Universal' },
  { code: '0163', name: 'Banco del Tesoro', type: 'Universal' },
  { code: '0166', name: 'Banco Agrícola de Venezuela', type: 'Especial' },
  { code: '0168', name: 'Bancrecer', type: 'Microfinanzas' },
  { code: '0169', name: 'Mi Banco', type: 'Microfinanzas' },
  { code: '0171', name: 'Banco Activo', type: 'Universal' },
  { code: '0172', name: 'Bancamiga', type: 'Universal' },
  { code: '0174', name: 'Banplus', type: 'Universal' },
  { code: '0175', name: 'Bicentenario', type: 'Universal' },
  { code: '0177', name: 'SOFITASA', type: 'Universal' },
];

export function getBankByCode(code: string): VenezuelanBank | undefined {
  return VENEZUELAN_BANKS.find(b => b.code === code);
}

export function getBankByName(name: string): VenezuelanBank | undefined {
  return VENEZUELAN_BANKS.find(b => b.name.toLowerCase() === name.toLowerCase());
}
