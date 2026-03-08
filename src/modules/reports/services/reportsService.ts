
import { supabase } from "@/shared/lib/supabase/client"

export interface RequestReportItem {
  cod_req_inss: number
  nome: string
  cpf: string
  data_req: string
  status?: string
  tipo_requerimento?: string
  emb_rgp?: string
  rgp?: string // Added rgp field
  emissao_rgp?: string
  protocolo?: string
  socio_id?: number // Added socio_id field
}

export const reportsService = {
  async fetchRequestsReport(): Promise<RequestReportItem[]> {
    // 1. Fetch requirements
    const { data: requerimentosData, error: reqError } = await supabase
      .from('req_inss')
      .select('*')
      .order('cod_req_inss', { ascending: false })

    if (reqError) throw reqError

    // 2. Extract unique CPFs
    const cpfsSocios = requerimentosData
      ?.filter(req => req.cpf)
      .map(req => req.cpf)
      .filter((value, index, self) => self.indexOf(value) === index) || []

    let sociosData: any[] = []
    
    // 3. Fetch member details (RGP) for those CPFs
    if (cpfsSocios.length > 0) {
      const { data: socios, error: sociosError } = await supabase
        .from('socios')
        .select('id, cpf, rgp, emissao_rgp')
        .in('cpf', cpfsSocios)

      if (sociosError) throw sociosError
      sociosData = socios || []
    }

    // 4. Merge data
    const mergedData = (requerimentosData || []).map(req => {
      const socio = sociosData.find(s => s.cpf === req.cpf)
      // Explicitly construct the object to satisfy the interface and avoid type errors
      const item: RequestReportItem = {
        cod_req_inss: Number(req.cod_req_inss),
        nome: String(req.nome || ''),
        cpf: String(req.cpf || ''),
        data_req: String(req.data_req || ''),
        status: req.status ? String(req.status) : undefined,
        tipo_requerimento: req.tipo_requerimento ? String(req.tipo_requerimento) : undefined,
        emb_rgp: req.emb_rgp ? String(req.emb_rgp) : undefined,
        protocolo: req.protocolo ? String(req.protocolo) : undefined,
        // Map fields to a consistent interface
        rgp: (socio?.rgp || req.emb_rgp || req.rgp) ? String(socio?.rgp || req.emb_rgp || req.rgp) : undefined,
        emissao_rgp: socio?.emissao_rgp ? String(socio?.emissao_rgp) : undefined,
        socio_id: socio?.id ? Number(socio.id) : undefined
      }
      return item
    })

    return mergedData
  }
}
