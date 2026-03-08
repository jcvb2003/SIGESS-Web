
import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { MemberDatabase, MemberSelectOption } from "../types/document.types";

type DocumentMemberContextType = {
  selectedMember: MemberSelectOption | null;
  setSelectedMember: (member: MemberSelectOption | null) => void;
  fullMemberData: MemberDatabase | null;
  isLoading: boolean;
  error: Error | null;
  refetchMember: () => void;
};

const DocumentMemberContext = createContext<DocumentMemberContextType | undefined>(undefined);

export function DocumentMemberProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [selectedMember, setSelectedMember] = useState<MemberSelectOption | null>(null);

  const {
    data: queryData,
    isLoading,
    error,
    refetch: refetchMember
  } = useQuery({
    queryKey: ['member-full-data', selectedMember?.id],
    queryFn: async () => {
      if (!selectedMember?.id) return null;

      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('id', selectedMember.id)
        .single();

      if (error) throw error;

      // TODO: Implement photo fetching logic if needed
      // const photoUrl = await memberService.getPhotoUrl(data.cpf);

      return {
        ...data,
        // foto_url: photoUrl
      } as unknown as MemberDatabase;
    },
    enabled: !!selectedMember?.id,
    staleTime: 5 * 60 * 1000,
  });

  const fullMemberData = queryData || null;

  useEffect(() => {
    // If navigating from another page with member data (e.g. from Member List "Generate Document")
    if (location.state?.member) {
        setSelectedMember(location.state.member);
    }
  }, [location.state]);

  return (
    <DocumentMemberContext.Provider value={{
      selectedMember,
      setSelectedMember,
      fullMemberData,
      isLoading,
      error,
      refetchMember
    }}>
      {children}
    </DocumentMemberContext.Provider>
  );
}

export const useDocumentMember = () => {
  const context = useContext(DocumentMemberContext);
  if (context === undefined) {
    throw new Error('useDocumentMember must be used within a DocumentMemberProvider');
  }
  return context;
};
