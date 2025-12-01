/**
 * @file APL Tree-sitter
 * @author Jesús Galán López (yiyus) <jgl@dyalog.com>
 * @license MIT
 */

/** /// <reference types="tree-sitter-cli/dsl" />
// @ts-check */

const DOP2 = 3;
const DOP1 = 2;
const DFN = 1;

const newline = /\n/;
const terminator = repeat1(choice(newline, '⋄', '\0'));
const separator = repeat1(';');
const lamp = '⍝';

const colon = ':';
const colons = '::';

const digits = /[0-9]+/;
const signed = seq(optional("¯"), digits);
const decimal = seq(signed, optional(seq(".", optional(digits))));
const exponent = seq(choice("E", "e"), optional("¯"), digits);
const real = seq(decimal, optional(exponent));
const imaginary = seq(choice("J", "j"), real);
const numberLiteral = seq(real, optional(imaginary));

const stringContentLiteral = /(''|[^'\n])+/;

const identifier = /⎕|⍞|[a-zA-ZⒶ-Ⓩ_∆⍙][a-zA-ZⒶ-Ⓩ_∆⍙0-9]*/;

const primitive = /[-←+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍠⌸⌺⌶⍎⍕→&⍬]/;

const literals = ['string', 'number'];
const expressions = [
  'namespace',
  'parenthesis',
  'highrank',
  'indices',
  'identifier',
];

module.exports = grammar({
  name: 'apl',

  extras: $ => [
    $.comment,
    /\s/,
  ],

  word: $ => $.identifier,

  externals: $ => [
    '⍺⍺', '⍵⍵', '∇∇',
    $._system_command,
    $._invalid_system_command,
  ],

  supertypes: $ => [
    $.definition,
  ],

  conflicts: $ => [
    [$.dop2_definition, $.dop1_definition, $.dfn_definition],
    [$.dop2_definition, $.dop1_definition],
    [$.dop2_parenthesis, $.dop1_parenthesis, $.dfn_parenthesis, $.parenthesis],
    [$.dop2_parenthesis, $.dop1_parenthesis, $.dfn_parenthesis],
    [$.dop2_parenthesis, $.dop1_parenthesis],
    [$.dop1_parenthesis, $.dfn_parenthesis, $.parenthesis],
    [$.dop1_parenthesis, $.dfn_parenthesis],
    [$.dfn_parenthesis, $.parenthesis],
    [$.dop2_namespace, $.dop1_namespace, $.dfn_namespace, $.namespace],
    [$.dop2_namespace, $.dop1_namespace, $.dfn_namespace],
    [$.dop2_namespace, $.dop1_namespace],
    [$.dop1_namespace, $.dfn_namespace, $.namespace],
    [$.dop1_namespace, $.dfn_namespace],
    [$.dfn_namespace, $.namespace],
    [$.dop2_highrank, $.dop1_highrank, $.dfn_highrank, $.highrank],
    [$.dop2_highrank, $.dop1_highrank, $.dfn_highrank],
    [$.dop2_highrank, $.dop1_highrank],
    [$.dop1_highrank, $.dfn_highrank, $.highrank],
    [$.dop1_highrank, $.dfn_highrank],
    [$.dfn_highrank, $.highrank],
    [$.dop2_indices, $.dop1_indices, $.dfn_indices, $.indices],
    [$.dop2_indices, $.dop1_indices, $.dfn_indices],
    [$.dop2_indices, $.dop1_indices],
    [$.dop1_indices, $.dfn_indices, $.indices],
    [$.dop1_indices, $.dfn_indices],
    [$.dfn_indices, $.indices],
    [$.dop2_highrank, $.dop2_indices],
    [$.dop1_highrank, $.dop1_indices],
    [$.dfn_highrank, $.dfn_indices],
    [$.indices, $.highrank],
  ],

  rules: {
    // a source_file is the whole code,
    // it might be a file or a code fragment
    source_file: $ => optional(choice(
      _statements($, 0),
      terminator,
    )),

    // outer scope statements can only be expressions,
    // dfns and dops can have guards and error guards too
    _statement: $ => statement($, 0),
    _dfn_statement: $ => statement($, DFN),
    _dop1_statement: $ => statement($, DOP1),
    _dop2_statement: $ => statement($, DOP2),

    // any _expression outer-scope valid expression
    _expression: $ => expression($, 0,
      $.definition,
      ...literals.map(l => $[l + '_literal']),
      $.system_command,
      $.primitive,
    ),
    // an _expression becomes a _dfn_expression with one of ⍺,⍵,∇,∇∇
    // (∇∇ is valid in dfns, it will produce a SYNTAX ERROR when run)
    _dfn_expression: $ => expression($, DFN, $.dop_identifier),
    _dop1_expression: $ => expression($, DOP1), // expression with ⍺⍺
    _dop2_expression: $ => expression($, DOP2), // expression with ⍵⍵

    // quad-commands returned by external scanner
    system_command: $ => $._system_command,

    // a definition is a braced statement list
    definition: $ => choice(
      $.dfn_definition,
      $.dop1_definition,
      $.dop2_definition,
    ),

    // by default, definitions are function definitions
    dfn_definition: $ => seq('{', optional(choice(
      statements($, DFN),
      statements($, 0),
      terminator,
    )), '}'),
    // if a definition includes a dop1 expression (and no dop2 expressions),
    // it is a dop1
    dop1_definition: $ => seq('{', statements($, DOP1), '}'),
    // if the definition includes any dop2 expression, it is a dop2
    dop2_definition: $ => seq('{', statements($, DOP2), '}'),

    // call factory function to generate rules for definition elements
    ...def_rules(),

    // additional identifiers are allowed inside definitions
    identifier: _ => identifier,
    dfn_identifier: _ => choice('⍺', '⍵', '∇'),
    dop_identifier: _ => '∇∇',
    dop1_identifier: _ => '⍺⍺',
    dop2_identifier: _ => '⍵⍵',

    // literals are strings, numbers, or primitives
    string_literal: $ => seq(
      "'",
      prec(1, optional($.string_literal_content)),
      token.immediate("'"),
    ),
    string_literal_content: _ => token.immediate(stringContentLiteral),
    number_literal: _ => token(numberLiteral),
    primitive: _ => primitive,

    // ilumination
    comment: _ => token(seq(lamp, /.*/)),
  },
});

function _def($$, name) {
  const prefixes = ['', 'dfn_', 'dop1_', 'dop2_'];
  const private = name[0] == '_' ? '_' : '';
  const base = name[0] == '_' ? name.substring(1) : name;
  return prefixes.map((prefix) => $$[private + prefix + base])
}

function _alias($$, name){
  const expressions = _def($$, '_expression');
  const aliases = _def($$, name);
  return expressions.map((ei, i) => alias(ei, aliases[i]));
}

function _choice(choices){
  const c0 = choices[0];
  const c1 = choice(choices[1], c0);
  const c2 = choice(choices[2], c1);
  const c3 = choice(choices[3], c2);
  return [c0, c1, c2, c3];
}

function expression($$, d, ...extra) {
  const prefix = ['', 'dfn_', 'dop1_', 'dop2_'][d];
  const expression = choice(
    ...expressions.map((expression) => $$[prefix + expression]),
    ...extra,
  );
  if (d == 0)
    return repeat1(prec.right(expression));
  const _expressions = _choice(_def($$, '_expression'));
  return prec.right(seq(
    optional(_expressions[d-1]),
    prec(1, expression),
    optional(_expressions[d]),
  ));
}

function statement($$, d) {
  const prefix = ['', 'dfn_', 'dop1_', 'dop2_'][d];
  const _expression = '_' + prefix + 'expression';
  const statement = prefix + 'statement';
  const error_guard = prefix + 'error_guard';
  const guard = prefix + 'guard';
  return prec.right(choice(...[
    $$[error_guard],
    $$[guard],
    alias($$[_expression], $$[statement]),
  ]));
}

function _separated(separator, statements, d){
  if (d == 0)
    return seq(
      optional(separator),
      statements[0],
      repeat(seq(separator, statements[0])),
      optional(separator),
    );
  const _statements = _choice(statements);
  return seq(
    optional(separator),
    repeat(seq(_statements[d-1], separator)),
    statements[d],
    repeat(seq(separator, _statements[d])),
    optional(separator),
  );
}

function _statements($$, d){
  return _separated(terminator, _alias($$, 'statement'), d);
}

function statements($$, d){
  return _separated(terminator, _def($$, '_statement'), d);
}

function _guard_expression($$, conditions, colon, expressions, d){
  if (d == 0)
    return seq(conditions[0], colon, expressions[0]);
  const _conditions = _choice(conditions);
  const _expressions = _choice(expressions);
  return choice(
    seq(_conditions[d-1], colon, expressions[d]),
    seq(conditions[d], colon, _expressions[d]),
  );
}

function def_rules() {
  const rules = {
    guard($$, d) {
      const conditions = _alias($$, 'guard_condition');
      const expressions = _alias($$, 'guard_expression');
      return _guard_expression($$, conditions, colon, expressions, d);
    },
    error_guard($$, d) {
      const conditions = _alias($$, 'error_guard_condition');
      const expressions = _alias($$, 'error_guard_expression');
      return _guard_expression($$, conditions, colons, expressions, d);
    },
    namespace($$, d) {
      const members = _separated(terminator, _def($$, 'member'), d);
      if (d == 0) return seq('(', optional(choice(
        members,
        terminator,
      )), ')');
      return seq('(', members, ')');
    },
    member($$, d) {
      const members = _alias($$, 'member_expression');
      const identifier = alias($$.identifier, $$.member_identifier);
      return seq(identifier, colon, members[d]);
    },
    parenthesis($$, d) {
      return seq('(', _statements($$, d), ')')
    },
    indices($$, d) {
      const indices = _separated(separator, _alias($$, 'index'), d);
      if (d == 0) return seq('[', optional(choice(
        indices,
        separator,
      )), ']');
      return seq('[', indices, ']');
    },
    highrank($$, d) {
      if (d == 0) return seq('[', optional(choice(
        _statements($$, 0),
        terminator,
      )), ']');
      return seq('[', _statements($$, d), ']');
    },
  };
  const keys = Object.keys(rules);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let fn = rules[k];
    rules[k] = $ => fn($, 0);
    rules['dfn_' + k] = $ => fn($, DFN);
    rules['dop1_' + k] = $ => fn($, DOP1);
    rules['dop2_' + k] = $ => fn($, DOP2);
  }
  return rules;
}
