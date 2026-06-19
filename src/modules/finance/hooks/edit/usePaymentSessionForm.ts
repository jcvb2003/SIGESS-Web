import { useReducer } from "react";
import { formatNumericInput } from "../../components/shared/formatters";
import { getTodayISO } from "@/shared/utils/date";
import type { ExtraFeeItem, SelectedCharge } from "../../components/forms/PaymentItemForm";
import type {
  ChargeType,
  PaymentMethod,
  PaymentType,
  SelectedAnnuity,
} from "../../types/finance.types";
import { isExtraFeeBlockedByHistoricMember } from "../../domain/paymentEligibility";

export type PaymentCategory = "anuidade" | "mensalidade";
export type ConfigMode = "isencao" | "liberacao" | "regime" | null;

const EXCLUSIVE_EXTRA_FEE_TYPES: Partial<Record<PaymentType, PaymentType[]>> = {
  inicial: ["transferencia"],
  transferencia: ["inicial"],
};

function isCompatibleExtraFee(existingType: PaymentType, nextType: PaymentType) {
  return !EXCLUSIVE_EXTRA_FEE_TYPES[nextType]?.includes(existingType);
}

export interface PaymentFormState {
  paymentCategory: PaymentCategory;
  selectedYears: SelectedAnnuity[];
  selectedMonths: number[];
  selectedYearForMensalidade: number;
  allowRetroactiveMonthly: boolean;
  extraFees: ExtraFeeItem[];
  selectedCharges: SelectedCharge[];
  paymentMethod: PaymentMethod;
  paymentDate: string;
  isHistoricMember: boolean;
  configMode: ConfigMode;
}

export type PaymentFormAction =
  | { type: "reset"; currentYear: number }
  | { type: "setConfigMode"; mode: ConfigMode }
  | { type: "setHistoricMember"; checked: boolean }
  | { type: "setPaymentCategory"; category: PaymentCategory }
  | { type: "toggleYear"; year: number; valorAnuidade: number }
  | { type: "updateAnnuityValue"; year: number; rawValue: string }
  | { type: "setSelectedMonths"; months: number[] }
  | { type: "setSelectedYearForMensalidade"; year: number }
  | { type: "setAllowRetroactiveMonthly"; checked: boolean }
  | { type: "toggleExtraFee"; paymentType: PaymentType; value: number; uid: string }
  | { type: "removeExtraFee"; uid: string }
  | { type: "updateExtraFeeValue"; uid: string; rawValue: string }
  | { type: "toggleCharge"; chargeType: ChargeType; uid: string }
  | { type: "updateChargeValue"; uid: string; rawValue: string }
  | { type: "removeCharge"; uid: string }
  | { type: "setPaymentMethod"; method: PaymentMethod }
  | { type: "setPaymentDate"; date: string };



function numericValueFromCurrencyInput(rawValue: string) {
  const digits = rawValue.replaceAll(/\D/g, "");
  return Number(digits) / 100;
}

function createPaymentFormState(currentYear: number): PaymentFormState {
  return {
    paymentCategory: "anuidade",
    selectedYears: [],
    selectedMonths: [],
    selectedYearForMensalidade: currentYear,
    allowRetroactiveMonthly: false,
    extraFees: [],
    selectedCharges: [],
    paymentMethod: "dinheiro",
    paymentDate: getTodayISO(),
    isHistoricMember: false,
    configMode: null,
  };
}

function paymentFormReducer(
  state: PaymentFormState,
  action: PaymentFormAction,
): PaymentFormState {
  switch (action.type) {
    case "reset":
      return createPaymentFormState(action.currentYear);
    case "setConfigMode":
      return { ...state, configMode: action.mode };
    case "setHistoricMember":
      return {
        ...state,
        isHistoricMember: action.checked,
        extraFees: action.checked
          ? state.extraFees.filter(
              (fee) => !isExtraFeeBlockedByHistoricMember(fee.tipo),
            )
          : state.extraFees,
      };
    case "setPaymentCategory":
      return { ...state, paymentCategory: action.category };
    case "toggleYear": {
      const exists = state.selectedYears.some((year) => year.year === action.year);
      const selectedYears = exists
        ? state.selectedYears.filter((year) => year.year !== action.year)
        : [
            ...state.selectedYears,
            {
              year: action.year,
              valor: action.valorAnuidade,
              displayValue: formatNumericInput(action.valorAnuidade),
            },
          ].sort((a, b) => b.year - a.year);
      return { ...state, selectedYears };
    }
    case "updateAnnuityValue": {
      const numericValue = numericValueFromCurrencyInput(action.rawValue);
      return {
        ...state,
        selectedYears: state.selectedYears.map((year) =>
          year.year === action.year
            ? {
                ...year,
                valor: numericValue,
                displayValue: formatNumericInput(numericValue),
              }
            : year,
        ),
      };
    }
    case "setSelectedMonths":
      return { ...state, selectedMonths: action.months };
    case "setSelectedYearForMensalidade":
      return {
        ...state,
        selectedYearForMensalidade: action.year,
        selectedMonths: [],
        allowRetroactiveMonthly: false,
      };
    case "setAllowRetroactiveMonthly":
      return {
        ...state,
        allowRetroactiveMonthly: action.checked,
        selectedMonths: action.checked ? state.selectedMonths : [],
      };
    case "toggleExtraFee": {
      const alreadyExists = state.extraFees.some(
        (fee) => fee.tipo === action.paymentType,
      );
      if (alreadyExists) {
        return {
          ...state,
          extraFees: state.extraFees.filter(
            (fee) => fee.tipo !== action.paymentType,
          ),
        };
      }

      const filteredFees = state.extraFees.filter((fee) =>
        isCompatibleExtraFee(fee.tipo, action.paymentType),
      );

      return {
        ...state,
        extraFees: [
          ...filteredFees,
          {
            tipo: action.paymentType,
            valor: action.value,
            displayValue: formatNumericInput(action.value),
            uid: action.uid,
          },
        ],
      };
    }
    case "removeExtraFee":
      return {
        ...state,
        extraFees: state.extraFees.filter((item) => item.uid !== action.uid),
      };
    case "updateExtraFeeValue": {
      const numericValue = numericValueFromCurrencyInput(action.rawValue);
      return {
        ...state,
        extraFees: state.extraFees.map((item) =>
          item.uid === action.uid
            ? {
                ...item,
                valor: numericValue,
                displayValue: formatNumericInput(numericValue),
              }
            : item,
        ),
      };
    }
    case "toggleCharge": {
      const exists = state.selectedCharges.some(
        (charge) => charge.chargeType.id === action.chargeType.id,
      );
      if (exists) {
        return {
          ...state,
          selectedCharges: state.selectedCharges.filter(
            (charge) => charge.chargeType.id !== action.chargeType.id,
          ),
        };
      }

      const value = action.chargeType.valor_padrao ?? 0;
      return {
        ...state,
        selectedCharges: [
          ...state.selectedCharges,
          {
            chargeType: action.chargeType,
            valor: value,
            displayValue: formatNumericInput(value),
            uid: action.uid,
          },
        ],
      };
    }
    case "updateChargeValue": {
      const numericValue = numericValueFromCurrencyInput(action.rawValue);
      return {
        ...state,
        selectedCharges: state.selectedCharges.map((charge) =>
          charge.uid === action.uid
            ? {
                ...charge,
                valor: numericValue,
                displayValue: formatNumericInput(numericValue),
              }
            : charge,
        ),
      };
    }
    case "removeCharge":
      return {
        ...state,
        selectedCharges: state.selectedCharges.filter(
          (charge) => charge.uid !== action.uid,
        ),
      };
    case "setPaymentMethod":
      return { ...state, paymentMethod: action.method };
    case "setPaymentDate":
      return { ...state, paymentDate: action.date };
  }
}

export function usePaymentSessionForm(currentYear: number) {
  const [state, dispatch] = useReducer(
    paymentFormReducer,
    currentYear,
    createPaymentFormState,
  );

  return { state, dispatch };
}
