export interface FisherIdentitySource {
  rgp?: string | null;
  num_rgp?: string | null;
  socio_num_rgp?: string | null;
  nit?: string | null;
  socio_nit?: string | null;
}

function firstFilled(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => !!value?.trim());
}

export function getRgpNumber(source: FisherIdentitySource): string | undefined {
  return firstFilled(source.rgp, source.num_rgp, source.socio_num_rgp);
}

export function getNitNumber(source: FisherIdentitySource): string | undefined {
  return firstFilled(source.nit, source.socio_nit);
}

export function getFishingRegistryDisplay(source: FisherIdentitySource): string | undefined {
  return getRgpNumber(source) ?? getNitNumber(source);
}
