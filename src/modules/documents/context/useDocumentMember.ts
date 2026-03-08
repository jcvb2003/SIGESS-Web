import { useContext } from "react";
import { DocumentMemberContext } from "./documentMemberContextStore";
export function useDocumentMember() {
  const context = useContext(DocumentMemberContext);
  if (context === undefined) {
    throw new Error(
      "useDocumentMember must be used within a DocumentMemberProvider",
    );
  }
  return context;
}
