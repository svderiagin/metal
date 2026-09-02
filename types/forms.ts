export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  consent: boolean;
  website?: string;
}

export interface QuoteRequest {
  name: string;
  phone: string;
  email: string;
  company?: string;
  message: string;
  consent: boolean;
  website?: string;
}
