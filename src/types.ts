export interface VintageShop {
  id: number;
  name: string;
  type: string;
  district: string;
  year: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  foto?: string;
}

export type FilterType = "all" | string;
