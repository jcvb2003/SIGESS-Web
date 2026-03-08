import { useState } from "react";

export function useReapSearch() {
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
