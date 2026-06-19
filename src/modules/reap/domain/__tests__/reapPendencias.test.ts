import { describe, it, expect } from 'vitest';
import {
  nomeMatchFn,
  extractAnos,
  buildMemberIndex,
} from '../reapPendencias';

// ─── nomeMatchFn ──────────────────────────────────────────────────────────────

describe('nomeMatchFn', () => {
  it('retorna true quando nome mascarado é prefixo do completo (X removidos)', () => {
    // 'JOAO SILVX' → remove X → 'JOAO SILV' — substring de 'JOAO SILVA SANTOS'
    expect(nomeMatchFn('JOAO SILVA SANTOS', 'JOAO SILVX')).toBe(true);
  });

  it('retorna true quando o mascarado é substring do completo sem X', () => {
    expect(nomeMatchFn('MARIA JOSE COSTA', 'JOSE')).toBe(true);
  });

  it('retorna true quando mascarado contém apenas início do nome (sem X)', () => {
    expect(nomeMatchFn('PEDRO ALVES LIMA', 'PEDRO ALVES')).toBe(true);
  });

  it('retorna false quando os nomes não compartilham substring', () => {
    expect(nomeMatchFn('ANA RODRIGUES', 'CARLOS PEREIRA')).toBe(false);
  });

  it('retorna false quando nomeMascarado vazio após normalização', () => {
    expect(nomeMatchFn('JOAO SILVA', 'XXX')).toBe(false);
    expect(nomeMatchFn('JOAO SILVA', '')).toBe(false);
  });

  it('normaliza acentos corretamente', () => {
    expect(nomeMatchFn('JOÃO SILVA', 'JOAO')).toBe(true);
    expect(nomeMatchFn('MARIA AMÉLIA', 'AMELIA')).toBe(true);
  });
});

// ─── extractAnos ──────────────────────────────────────────────────────────────

describe('extractAnos', () => {
  it('extrai anos 2021-2024 de sequência de linhas', () => {
    const lines = ['2021', '2022', 'OUTRO'];
    const result = extractAnos(lines, 0);
    expect(result.anos).toEqual([2021, 2022]);
    expect(result.nextIndex).toBe(2);
  });

  it('para na primeira linha que não é ano nem vírgula/vazio', () => {
    const lines = ['2023', 'MUNICIPIO'];
    const result = extractAnos(lines, 0);
    expect(result.anos).toEqual([2023]);
    expect(result.nextIndex).toBe(1);
  });

  it('pula vírgulas e strings vazias', () => {
    const lines = ['2021', ',', '', '2023', 'FIM'];
    const result = extractAnos(lines, 0);
    expect(result.anos).toEqual([2021, 2023]);
  });

  it('retorna array vazio quando não há anos na posição inicial', () => {
    const lines = ['NOME', 'CPF'];
    const result = extractAnos(lines, 0);
    expect(result.anos).toEqual([]);
    expect(result.nextIndex).toBe(0);
  });
});

// ─── buildMemberIndex ─────────────────────────────────────────────────────────

describe('buildMemberIndex', () => {
  it('indexa membros por dígitos 3-9 do CPF', () => {
    const members = [
      { cpf: '123.456.789-00', nome: 'JOAO' },
      { cpf: '987.456.321-11', nome: 'MARIA' },
    ];
    const index = buildMemberIndex(members);
    expect(index.has('456789')).toBe(true);
    expect(index.get('456789')?.[0].nome).toBe('JOAO');
  });

  it('agrupa múltiplos membros com mesmos dígitos centrais', () => {
    const members = [
      { cpf: '111.111.111-11', nome: 'A' },
      { cpf: '222.111.111-22', nome: 'B' },
    ];
    const index = buildMemberIndex(members);
    expect(index.get('111111')?.length).toBe(2);
  });

  it('ignora membros com CPF vazio (string vazia)', () => {
    const members = [
      { cpf: '', nome: 'SEM CPF' },
      { cpf: '123.456.789-00', nome: 'COM CPF' },
    ];
    const index = buildMemberIndex(members);
    expect(index.size).toBe(1);
  });
});
