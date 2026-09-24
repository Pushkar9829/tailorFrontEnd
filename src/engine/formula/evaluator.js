import { FormulaError, parse, collectDependencies } from "./parser.js";

const ALLOWED_CALLS = new Set(["min", "max"]);

function evaluateAst(ast, scope, points) {
  switch (ast.type) {
    case "num":
      return ast.value;
    case "var": {
      if (!Object.prototype.hasOwnProperty.call(scope, ast.name)) {
        throw new FormulaError(`Unknown variable "${ast.name}"`);
      }
      const value = scope[ast.name];
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new FormulaError(`Variable "${ast.name}" is not a number`);
      }
      return value;
    }
    case "ref": {
      const point = points?.[ast.id];
      if (!point) throw new FormulaError(`Unknown point "${ast.id}"`);
      const value = point[ast.axis];
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new FormulaError(`Point "${ast.id}.${ast.axis}" is not resolved`);
      }
      return value;
    }
    case "unary": {
      const value = evaluateAst(ast.expr, scope, points);
      return ast.op === "-" ? -value : value;
    }
    case "binary": {
      const left = evaluateAst(ast.left, scope, points);
      const right = evaluateAst(ast.right, scope, points);
      if (ast.op === "+") return left + right;
      if (ast.op === "-") return left - right;
      if (ast.op === "*") return left * right;
      if (ast.op === "/") {
        if (right === 0) throw new FormulaError("Division by zero");
        return left / right;
      }
      throw new FormulaError(`Unknown operator "${ast.op}"`);
    }
    case "call": {
      const name = ast.name.toLowerCase();
      if (!ALLOWED_CALLS.has(name)) throw new FormulaError(`Function "${ast.name}" is not allowed`);
      const args = ast.args.map((arg) => evaluateAst(arg, scope, points));
      if (args.length < 1) throw new FormulaError(`${name}() needs at least one argument`);
      return name === "min" ? Math.min(...args) : Math.max(...args);
    }
    default:
      throw new FormulaError("Invalid formula node");
  }
}

function topologicalOrder(formulas, asts) {
  const keys = Object.keys(formulas);
  const visiting = new Set();
  const visited = new Set();
  const order = [];

  function visit(key, stack) {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      throw new FormulaError(`Formula cycle: ${[...stack, key].join(" -> ")}`);
    }
    visiting.add(key);
    const deps = collectDependencies(asts[key]);
    for (const dep of deps) {
      if (Object.prototype.hasOwnProperty.call(formulas, dep)) {
        visit(dep, [...stack, key]);
      }
    }
    visiting.delete(key);
    visited.add(key);
    order.push(key);
  }

  for (const key of keys) visit(key, []);
  return order;
}

function evaluateFormulas(formulas, inputs) {
  const asts = {};
  const dependencies = {};
  for (const [name, source] of Object.entries(formulas)) {
    asts[name] = parse(String(source));
    dependencies[name] = [...collectDependencies(asts[name])];
  }

  const scope = { ...inputs };
  const order = topologicalOrder(formulas, asts);
  const derived = {};
  for (const name of order) {
    const value = evaluateAst(asts[name], scope, {});
    scope[name] = value;
    derived[name] = value;
  }

  return { scope, derived, dependencies, order };
}

function evaluateExpression(source, scope, points = {}) {
  const ast = parse(String(source));
  return {
    value: evaluateAst(ast, scope, points),
    dependencies: [...collectDependencies(ast)],
  };
}

export { evaluateAst, evaluateFormulas, evaluateExpression };
