export interface MembershipCompetencyContext {
  admissionYear: number | null;
  admissionMonth: number | null;
}

export function getMembershipCompetencyContext(
  admissionDate?: string | null,
): MembershipCompetencyContext {
  if (!admissionDate) {
    return { admissionYear: null, admissionMonth: null };
  }

  const [yearPart, monthPart] = admissionDate.split("-");
  const admissionYear = Number(yearPart);
  const admissionMonth = Number(monthPart);

  if (
    !Number.isInteger(admissionYear) ||
    !Number.isInteger(admissionMonth) ||
    admissionMonth < 1 ||
    admissionMonth > 12
  ) {
    return { admissionYear: null, admissionMonth: null };
  }

  return { admissionYear, admissionMonth };
}

export function getFirstRequiredMonthForYear(
  selectedYear: number,
  admissionDate?: string | null,
): number {
  const { admissionYear, admissionMonth } =
    getMembershipCompetencyContext(admissionDate);

  if (admissionYear == null || admissionMonth == null) {
    return 1;
  }

  if (selectedYear < admissionYear) {
    return 13;
  }

  if (selectedYear === admissionYear) {
    return admissionMonth;
  }

  return 1;
}

export function isMonthBeforeMembership(
  selectedYear: number,
  month: number,
  admissionDate?: string | null,
): boolean {
  return month < getFirstRequiredMonthForYear(selectedYear, admissionDate);
}
