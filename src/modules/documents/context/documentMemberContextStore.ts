import { createContext } from "react";
import { DocumentMemberContextType } from "./DocumentMemberContext";
export const DocumentMemberContext = createContext<
  DocumentMemberContextType | undefined
>(undefined);
