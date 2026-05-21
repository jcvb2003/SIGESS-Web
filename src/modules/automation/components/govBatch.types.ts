export type SocioSelecionado = {
  cpf: string;
  nome: string;
  senhagov: string;
  anosSimplificadoPendentes: number[];
  anosAnualPendentes: number[];
};

export type GovBatchDaeAction = "registrar" | "marcar_pago" | "registrado";
