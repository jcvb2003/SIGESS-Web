import { useState } from "react";

export function useRequirementSearch() {
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
