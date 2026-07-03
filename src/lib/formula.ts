/**
 * formula.ts — a small, SAFE expression evaluator for 'calculated' subquestions
 * (2026-07-03). No eval()/Function(): a hand-written tokenizer + recursive-descent
 * parser to an AST, then a value walk.
 *
 * An author writes an expression referencing sibling subquestions by a stable
 * token {sq:<subquestionId>} (rename-safe — never the label), numeric literals,
 * the operators + - * / and parentheses, plus two helpers for time:
 *   MONTHS({sq:<durationField>})              -> years*12 + months
 *   MONTHS_BETWEEN({sq:<dateA>}, {sq:<dateB>}) -> whole months from A to B (B − A)
 *
 * Example: {sq:loan} / MONTHS({sq:term})  (a monthly amount).
 *
 * Values are supplied by a caller-provided resolve(subqId) => Resolved. Any null
 * operand, unknown reference, division by zero, or parse error yields null (the
 * field renders blank) — never NaN/Infinity, never a throw to the caller.
 * validateFormula() checks structure only (value-independent) for authoring.
 */

export interface Resolved {
  number: number | null;
  years: number | null;
  months: number | null;
  date: string | null;
}

export function monthsOf(r: Resolved): number | null {
  if (r.years == null && r.months == null) return null;
  return (r.years ?? 0) * 12 + (r.months ?? 0);
}

export function monthsBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

// All {sq:<id>} references in an expression (for the token picker / to know which
// siblings feed a calculated field). Order-preserving, de-duplicated.
export function extractRefs(expr: string): string[] {
  const out: string[] = [];
  const re = /\{sq:([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

// ── Tokenizer ────────────────────────────────────────────────────────────────
type Tok =
  | { t: 'num'; v: number }
  | { t: 'ref'; v: string }
  | { t: 'fn'; v: 'MONTHS' | 'MONTHS_BETWEEN' }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: '(' } | { t: ')' } | { t: ',' };

function tokenize(expr: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '(') { toks.push({ t: '(' }); i++; continue; }
    if (c === ')') { toks.push({ t: ')' }); i++; continue; }
    if (c === ',') { toks.push({ t: ',' }); i++; continue; }
    if (c === '+' || c === '-' || c === '*' || c === '/') { toks.push({ t: 'op', v: c }); i++; continue; }
    if (c === '{') {
      const end = expr.indexOf('}', i);
      if (end === -1) return null;
      const inner = expr.slice(i + 1, end);
      if (!inner.startsWith('sq:') || inner.length <= 3) return null;
      toks.push({ t: 'ref', v: inner.slice(3) });
      i = end + 1;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < expr.length && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) j++;
      const n = parseFloat(expr.slice(i, j));
      if (!Number.isFinite(n)) return null;
      toks.push({ t: 'num', v: n });
      i = j;
      continue;
    }
    if ((c >= 'A' && c <= 'Z') || c === '_') {
      let j = i + 1;
      while (j < expr.length && ((expr[j] >= 'A' && expr[j] <= 'Z') || expr[j] === '_')) j++;
      const word = expr.slice(i, j);
      if (word === 'MONTHS' || word === 'MONTHS_BETWEEN') toks.push({ t: 'fn', v: word });
      else return null; // unknown identifier
      i = j;
      continue;
    }
    return null; // unexpected character
  }
  return toks;
}

// ── AST ──────────────────────────────────────────────────────────────────────
type Node =
  | { k: 'num'; v: number }
  | { k: 'ref'; id: string }
  | { k: 'neg'; e: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/'; l: Node; r: Node }
  | { k: 'months'; id: string }
  | { k: 'monthsBetween'; a: string; b: string };

class ParseError extends Error {}

// expr   := term (('+'|'-') term)*
// term   := factor (('*'|'/') factor)*
// factor := num | ref | fn | '(' expr ')' | '-' factor
// fn     := 'MONTHS' '(' ref ')' | 'MONTHS_BETWEEN' '(' ref ',' ref ')'
function parse(expr: string): Node | null {
  const toks = tokenize(expr);
  if (!toks || toks.length === 0) return null;
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];
  const expect = (t: Tok['t']) => { const tok = next(); if (!tok || tok.t !== t) throw new ParseError(); return tok; };
  const isOp = (v: string) => { const p = peek(); return !!p && p.t === 'op' && (p as { v: string }).v === v; };

  const parseExpr = (): Node => {
    let acc = parseTerm();
    while (isOp('+') || isOp('-')) {
      const op = (next() as { v: '+' | '-' }).v;
      acc = { k: 'bin', op, l: acc, r: parseTerm() };
    }
    return acc;
  };
  const parseTerm = (): Node => {
    let acc = parseFactor();
    while (isOp('*') || isOp('/')) {
      const op = (next() as { v: '*' | '/' }).v;
      acc = { k: 'bin', op, l: acc, r: parseFactor() };
    }
    return acc;
  };
  const parseFactor = (): Node => {
    const tok = peek();
    if (!tok) throw new ParseError();
    if (tok.t === 'op' && tok.v === '-') { next(); return { k: 'neg', e: parseFactor() }; }
    if (tok.t === 'num') { next(); return { k: 'num', v: tok.v }; }
    if (tok.t === 'ref') { next(); return { k: 'ref', id: tok.v }; }
    if (tok.t === '(') { next(); const e = parseExpr(); expect(')'); return e; }
    if (tok.t === 'fn') {
      next();
      expect('(');
      const a = expect('ref') as { v: string };
      if (tok.v === 'MONTHS') { expect(')'); return { k: 'months', id: a.v }; }
      expect(',');
      const b = expect('ref') as { v: string };
      expect(')');
      return { k: 'monthsBetween', a: a.v, b: b.v };
    }
    throw new ParseError();
  };

  try {
    const ast = parseExpr();
    if (pos !== toks.length) return null; // trailing tokens = malformed
    return ast;
  } catch {
    return null;
  }
}

function evalNode(n: Node, resolve: (subqId: string) => Resolved): number | null {
  switch (n.k) {
    case 'num': return n.v;
    case 'ref': return resolve(n.id).number;
    case 'neg': { const e = evalNode(n.e, resolve); return e == null ? null : -e; }
    case 'months': return monthsOf(resolve(n.id));
    case 'monthsBetween': return monthsBetween(resolve(n.a).date, resolve(n.b).date);
    case 'bin': {
      const l = evalNode(n.l, resolve);
      const r = evalNode(n.r, resolve);
      if (l == null || r == null) return null;
      switch (n.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? null : l / r;
      }
    }
  }
}

// Evaluate an expression against resolved sibling values. Null on any missing
// value, division by zero, or malformed expression.
export function evalFormula(expr: string, resolve: (subqId: string) => Resolved): number | null {
  if (!expr || !expr.trim()) return null;
  const ast = parse(expr);
  if (!ast) return null;
  const result = evalNode(ast, resolve);
  if (result == null || !Number.isFinite(result)) return null;
  return result;
}

// Structural (value-independent) validity, for the authoring UI. An empty
// expression is treated as valid (nothing written yet).
export function validateFormula(expr: string): boolean {
  if (!expr || !expr.trim()) return true;
  return parse(expr) !== null;
}
