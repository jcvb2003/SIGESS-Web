export type { EntitySettings } from "@/shared/types/entity.types";
export { defaultEntitySettings } from "@/shared/types/entity.types";
export interface SystemParameters {
  id?: string;
  maintenanceMode: boolean;
  maxUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  defeso1Start: string | null;
  defeso1End: string | null;
  defeso2Start: string | null;
  defeso2End: string | null;
  defesoSpecies: string;
  publicationNumber: string;
  publicationDate: string | null;
  publicationLocal: string;
  fishingArea: string;
}
export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}
export interface SystemUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}
export interface Locality {
  id?: string;
  name: string;
  code?: string;
}
export interface DocumentTemplate {
  id: string;
  name: string;
  documentType: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
  fontConfigurations?: string;
}
export const defaultParametersSettings: SystemParameters = {
  id: undefined,
  maintenanceMode: false,
  maxUploadSize: 5,
  allowedFileTypes: [".pdf", ".jpg", ".png"],
  sessionTimeout: 30,
  defeso1Start: null,
  defeso1End: null,
  defeso2Start: null,
  defeso2End: null,
  defesoSpecies: "",
  publicationNumber: "",
  publicationDate: null,
  publicationLocal: "",
  fishingArea: "",
};
