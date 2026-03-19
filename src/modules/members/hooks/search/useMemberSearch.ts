import { useState } from "react";
export function useMemberSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  return {
    searchTerm,
    setSearchTerm,
    handleSearchChange,
  };
}
