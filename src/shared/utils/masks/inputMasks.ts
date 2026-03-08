export const masks = {
  cpf: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+$/, "$1");
  },
  cnpj: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+$/, "$1");
  },
  phone: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+$/, "$1");
  },
  cep: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+$/, "$1");
  },
  date: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+$/, "$1");
  },
  currency: (value: string) => {
    const number = value.replaceAll(/\D/g, "");
    const result = (Number(number) / 100).toFixed(2);
    return result.replaceAll(".", ",").replaceAll(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  },
  caepf: (value: string) => {
    const v = value.replaceAll(/\D/g, "");
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
    if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    if (v.length <= 12)
      return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}/${v.slice(9)}`;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}/${v.slice(
      9,
      12
    )}-${v.slice(12, 14)}`;
  },
  cei: (value: string) => {
    const v = value.replaceAll(/\D/g, "");
    if (v.length <= 2) return v;
    if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2, 5)}`;
    if (v.length <= 10)
      return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 10)}`;
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 10)}/${v.slice(
      10,
      12
    )}`;
  },
  nit: (value: string) => {
    const v = value.replaceAll(/\D/g, "");
    if (v.length <= 3) return v;
    if (v.length <= 8) return `${v.slice(0, 3)}.${v.slice(3)}`;
    if (v.length <= 10)
      return `${v.slice(0, 3)}.${v.slice(3, 8)}.${v.slice(8)}`;
    return `${v.slice(0, 3)}.${v.slice(3, 8)}.${v.slice(8, 10)}-${v.slice(
      10,
      11
    )}`;
  },
  electoralTitle: (value: string) => {
    return value
      .replaceAll(/\D/g, "")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/( \d{4})\d+$/, "$1");
  },
  numbers: (value: string) => {
    return value.replaceAll(/\D/g, "");
  },
};
