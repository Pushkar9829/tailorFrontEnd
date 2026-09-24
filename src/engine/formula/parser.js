const FormulaError = class FormulaError extends Error {
  constructor(message) {
    super(message);
    this.name = "FormulaError";
  }
};

function isIdentStart(ch) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

function parse(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new FormulaError("Formula is empty");
  }

  const input = source.trim();
  let i = 0;

  function peek() {
    return input[i];
  }

  function skip() {
    while (i < input.length && /\s/.test(input[i])) i += 1;
  }

  function parseExpression() {
    let node = parseTerm();
    skip();
    while (peek() === "+" || peek() === "-") {
      const op = peek();
      i += 1;
      const right = parseTerm();
      node = { type: "binary", op, left: node, right };
      skip();
    }
    return node;
  }

  function parseTerm() {
    let node = parseUnary();
    skip();
    while (peek() === "*" || peek() === "/") {
      const op = peek();
      i += 1;
      const right = parseUnary();
      node = { type: "binary", op, left: node, right };
      skip();
    }
    return node;
  }

  function parseUnary() {
    skip();
    if (peek() === "+") {
      i += 1;
      return parseUnary();
    }
    if (peek() === "-") {
      i += 1;
      return { type: "unary", op: "-", expr: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    skip();
    const ch = peek();
    if (ch === "(") {
      i += 1;
      const node = parseExpression();
      skip();
      if (peek() !== ")") throw new FormulaError(`Expected ')' in "${input}"`);
      i += 1;
      return node;
    }

    if (ch >= "0" && ch <= "9") {
      const start = i;
      i += 1;
      while (i < input.length && /[0-9.]/.test(input[i])) i += 1;
      const raw = input.slice(start, i);
      if (!/^\d+(\.\d+)?$/.test(raw)) throw new FormulaError(`Invalid number "${raw}"`);
      return { type: "num", value: Number(raw) };
    }

    if (isIdentStart(ch)) {
      const start = i;
      i += 1;
      while (i < input.length && isIdentPart(input[i])) i += 1;
      const name = input.slice(start, i);
      skip();
      if (peek() === "(") {
        i += 1;
        const args = [];
        skip();
        if (peek() !== ")") {
          args.push(parseExpression());
          skip();
          while (peek() === ",") {
            i += 1;
            args.push(parseExpression());
            skip();
          }
        }
        if (peek() !== ")") throw new FormulaError(`Expected ')' after ${name}(`);
        i += 1;
        return { type: "call", name, args };
      }
      if (peek() === ".") {
        i += 1;
        skip();
        if (!isIdentStart(peek())) throw new FormulaError(`Expected axis after "${name}."`);
        const axisStart = i;
        i += 1;
        while (i < input.length && isIdentPart(input[i])) i += 1;
        const axis = input.slice(axisStart, i);
        if (axis !== "x" && axis !== "y") {
          throw new FormulaError(`Point axis must be x or y, got "${axis}"`);
        }
        return { type: "ref", id: name, axis };
      }
      return { type: "var", name };
    }

    throw new FormulaError(`Unexpected "${ch ?? "end"}" in "${input}"`);
  }

  const ast = parseExpression();
  skip();
  if (i < input.length) throw new FormulaError(`Unexpected trailing "${input.slice(i)}" in "${input}"`);
  return ast;
}

function collectDependencies(ast, into = new Set()) {
  if (!ast) return into;
  if (ast.type === "var") into.add(ast.name);
  if (ast.type === "ref") into.add(`${ast.id}.${ast.axis}`);
  if (ast.type === "unary") collectDependencies(ast.expr, into);
  if (ast.type === "binary") {
    collectDependencies(ast.left, into);
    collectDependencies(ast.right, into);
  }
  if (ast.type === "call") ast.args.forEach((arg) => collectDependencies(arg, into));
  return into;
}

export { FormulaError, parse, collectDependencies };
