export interface EntitySettings {
  id?: string;
  name: string;
  shortName: string;
  cnpj: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  phone1: string;
  phone2: string;
  email: string;
  federation: string;
  confederation: string;
  pole: string;
  foundation: string;
  county: string;
}
export const defaultEntitySettings: EntitySettings = {
  id: undefined,
  name: "",
  shortName: "",
  cnpj: "",
  street: "",
  number: "",
  district: "",
  city: "",
  state: "",
  cep: "",
  phone1: "",
  phone2: "",
  email: "",
  federation: "",
  confederation: "",
  pole: "",
  foundation: "",
  county: "",
};
