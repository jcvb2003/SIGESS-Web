export class DuplicateCpfError extends Error {
  code = "DUPLICATE_CPF";
  constructor(message = "CPF já cadastrado.") {
    super(message);
    this.name = "DuplicateCpfError";
  }
}

export class LimitExceededError extends Error {
  code = "LIMIT_EXCEEDED";
  constructor(message = "Limite de cadastros atingido para este período de teste.") {
    super(message);
    this.name = "LimitExceededError";
  }
}
