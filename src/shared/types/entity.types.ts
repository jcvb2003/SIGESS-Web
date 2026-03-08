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
  presidentName: string;
  presidentCpf: string;
  corPrimaria: string;
  corSecundaria: string;
  corSidebar: string;
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
  presidentName: "",
  presidentCpf: "",
  corPrimaria: "160 84% 39%",
  corSecundaria: "152 69% 41%",
  corSidebar: "160 84% 39%",
};
