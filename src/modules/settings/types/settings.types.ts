export interface EntitySettings {
  id?: number
  name: string
  shortName: string
  cnpj: string
  street: string
  number: string
  district: string
  city: string
  state: string
  cep: string
  phone1: string
  phone2: string
  email: string
  federation: string
  confederation: string
  pole: string
  foundation: string
  county: string
}

export interface ParametersSettings {
  id?: number
  defeso1Start: string | null
  defeso1End: string | null
  defeso2Start: string | null
  defeso2End: string | null
  defesoSpecies: string
  publicationNumber: string
  publicationDate: string | null
  publicationLocal: string
  fishingArea: string
}

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
}

export interface SystemUser {
  id: string
  email: string
  role: string
  createdAt: string
}

export interface Locality {
  id: string
  name: string
  code: string
}

export interface DocumentTemplate {
  id: string
  name: string
  documentType: string
  filePath: string
  fileUrl: string
  fileSize: number
  contentType: string
  createdAt: string
}

export const defaultEntitySettings: EntitySettings = {
  id: undefined,
  name: '',
  shortName: '',
  cnpj: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: '',
  cep: '',
  phone1: '',
  phone2: '',
  email: '',
  federation: '',
  confederation: '',
  pole: '',
  foundation: '',
  county: '',
}

export const defaultParametersSettings: ParametersSettings = {
  id: undefined,
  defeso1Start: null,
  defeso1End: null,
  defeso2Start: null,
  defeso2End: null,
  defesoSpecies: '',
  publicationNumber: '',
  publicationDate: null,
  publicationLocal: '',
  fishingArea: '',
}
