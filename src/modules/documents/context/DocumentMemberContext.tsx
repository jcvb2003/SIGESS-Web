import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { MemberDatabase, MemberSelectOption } from "../types/document.types";
import { photoService } from "@/modules/members/services/photoService";
import { DocumentMemberContext } from "./documentMemberContextStore";
export type DocumentMemberContextType = {
  selectedMember: MemberSelectOption | null;
  setSelectedMember: (member: MemberSelectOption | null) => void;
  fullMemberData: MemberDatabase | null;
  isLoading: boolean;
  error: Error | null;
  refetchMember: () => void;
};
export function DocumentMemberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [selectedMember, setSelectedMember] =
    useState<MemberSelectOption | null>(location.state?.member ?? null);
  const routeMember = location.state?.member ?? null;
  const activeMember = selectedMember ?? routeMember;
  const {
    data: queryData,
    isLoading,
    error,
    refetch: refetchMember,
  } = useQuery({
    queryKey: ["member-full-data", activeMember?.id],
    queryFn: async () => {
      if (!activeMember?.id) return null;
      const { data, error } = await supabase
        .from("socios")
        .select("*")
        .eq("id", activeMember.id)
        .single();
      if (error) throw error;
      let photoUrl: string | null = null;
      if (data.cpf && typeof data.cpf === "string") {
        photoUrl = await photoService.getPhotoUrl(data.cpf);
      }
      return {
        ...data,
        foto_url: photoUrl,
      } as unknown as MemberDatabase;
    },
    enabled: !!activeMember?.id,
  });
  const fullMemberData = queryData || null;
  return (
    <DocumentMemberContext.Provider
      value={{
        selectedMember: activeMember,
        setSelectedMember,
        fullMemberData,
        isLoading,
        error,
        refetchMember,
      }}
    >
      {children}
    </DocumentMemberContext.Provider>
  );
}
