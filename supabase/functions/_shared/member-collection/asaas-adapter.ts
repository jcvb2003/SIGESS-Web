import { AsaasClient, AsaasApiError } from './asaas-client.ts';
import type { ICollectionProvider, EnsureMemberCustomerInput, CreateMemberChargeInput } from './provider.interface.ts';
import type { MemberCharge, CollectionWebhookEvent, CollectionWebhookEventType } from './types.ts';

interface AsaasListResponse<T> {
  data: T[];
  totalCount: number;
}

interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
}

interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixKey?: string;
}

interface AsaasWebhookBody {
  event: string;
  payment?: {
    id?: string;
    status?: string;
    paymentDate?: string;
    externalReference?: string;
  };
}

function mapAsaasStatus(asaasStatus: string): MemberCharge['status'] {
  switch (asaasStatus) {
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RECEIVED_IN_CASH':
      return 'paga';
    case 'OVERDUE':
      return 'expirada';
    case 'REFUNDED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
    case 'DUNNING_RECEIVED':
      return 'cancelada';
    default:
      return 'pendente';
  }
}

function mapAsaasWebhookEvent(asaasEvent: string): CollectionWebhookEventType {
  switch (asaasEvent) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED_IN_CASH':
      return 'PAYMENT_RECEIVED';
    case 'PAYMENT_OVERDUE':
      return 'PAYMENT_OVERDUE';
    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_REFUND_REQUESTED':
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
      return 'PAYMENT_REFUNDED';
    default:
      return 'OTHER';
  }
}

function mapPayment(res: AsaasPayment): MemberCharge {
  return {
    providerChargeId: res.id,
    providerRawStatus: res.status,
    status: mapAsaasStatus(res.status),
    amount: res.value,
    dueDate: res.dueDate,
    paymentUrl: res.invoiceUrl ?? res.bankSlipUrl ?? undefined,
    pixCode: res.pixKey ?? undefined,
    pixQrCodeUrl: res.pixQrCodeUrl ?? undefined,
    paidAt: res.paymentDate ? `${res.paymentDate}T00:00:00Z` : undefined,
  };
}

export class AsaasCollectionAdapter implements ICollectionProvider {
  readonly name = 'asaas';
  private readonly client: AsaasClient;

  constructor(apiKey: string, sandbox: boolean) {
    this.client = new AsaasClient(apiKey, sandbox);
  }

  async ensureCustomer(input: EnsureMemberCustomerInput): Promise<{ providerId: string }> {
    const externalReference = `${input.tenantId}:${input.cpf}`;

    const list = await this.client.get<AsaasListResponse<AsaasCustomer>>(
      '/customers',
      { externalReference, limit: '1' },
    );

    if (list.data.length > 0) {
      const existing = list.data[0];
      await this.client.post<AsaasCustomer>(`/customers/${existing.id}`, {
        name: input.nome,
        cpfCnpj: input.cpf,
        ...(input.email ? { email: input.email } : {}),
        ...(input.telefone ? { mobilePhone: input.telefone } : {}),
      });
      return { providerId: existing.id };
    }

    const created = await this.client.post<AsaasCustomer>('/customers', {
      name: input.nome,
      cpfCnpj: input.cpf,
      externalReference,
      ...(input.email ? { email: input.email } : {}),
      ...(input.telefone ? { mobilePhone: input.telefone } : {}),
    });
    return { providerId: created.id };
  }

  async createCharge(input: CreateMemberChargeInput): Promise<MemberCharge> {
    const res = await this.client.post<AsaasPayment>('/payments', {
      customer: input.providerCustomerId,
      billingType: input.billingType,
      value: input.amount,
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
    });
    return mapPayment(res);
  }

  async cancelCharge(providerChargeId: string): Promise<void> {
    try {
      await this.client.delete(`/payments/${providerChargeId}`);
    } catch (err) {
      if (err instanceof AsaasApiError && err.status === 404) return;
      throw err;
    }
  }

  async fetchCharge(providerChargeId: string): Promise<MemberCharge> {
    const res = await this.client.get<AsaasPayment>(`/payments/${providerChargeId}`);
    return mapPayment(res);
  }

  parseWebhookEvent(
    rawBody: string,
    headers: Record<string, string>,
    webhookToken: string,
  ): CollectionWebhookEvent {
    const incomingToken = headers['asaas-access-token'];
    if (!incomingToken || incomingToken !== webhookToken) {
      throw new Error('Invalid webhook token');
    }

    const body = JSON.parse(rawBody) as AsaasWebhookBody;
    const type = mapAsaasWebhookEvent(body.event ?? '');

    const requiresChargeId = type !== 'OTHER';
    const providerChargeId = body.payment?.id;
    if (requiresChargeId && !providerChargeId) {
      throw new Error(
        `Webhook malformado: evento '${body.event}' requer payment.id mas não o enviou`,
      );
    }

    const paidAt = body.payment?.paymentDate
      ? `${body.payment.paymentDate}T00:00:00Z`
      : undefined;

    return {
      type,
      rawEventType: body.event ?? '',
      providerChargeId: providerChargeId ?? '',
      externalReference: body.payment?.externalReference ?? undefined,
      paidAt,
      rawPayload: body,
    };
  }
}

export function createCollectionProvider(apiKey: string, sandbox: boolean): ICollectionProvider {
  return new AsaasCollectionAdapter(apiKey, sandbox);
}

export { AsaasApiError };
