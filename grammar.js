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

const definitions = [ 'dop2', 'dop1', 'dfn'];
const literals = ['string', 'number'];
const expressions = [
  'namespace',
  'indices',
  'parenthesis',
  'highrank',
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
    source_file: $ => optional(choice(
      _statements($, 0),
      terminator,
    )),

    _statement: $ => statement($, 0),
    _dfn_statement: $ => statement($, DFN),
    _dop1_statement: $ => statement($, DOP1),
    _dop2_statement: $ => statement($, DOP2),

    _expression: $ => expression($, 0,
      ...definitions.map(d => $[d + '_definition']),
      ...literals.map(l => $[l + '_literal']),
      $.system_command,
      $.primitive,
    ),
    _dfn_expression: $ => expression($, DFN, $.dop_identifier),
    _dop1_expression: $ => expression($, DOP1),
    _dop2_expression: $ => expression($, DOP2),

    system_command: $ => $._system_command,

    dfn_definition: $ => seq('{', optional(choice(
      statements($, DFN),
      statements($, 0),
      terminator,
    )), '}'),
    dop1_definition: $ => seq('{', statements($, DOP1), '}'),
    dop2_definition: $ => seq('{', statements($, DOP2), '}'),

    error_guard: $ => error_guard_expression($, 0),
    dfn_error_guard: $ => error_guard_expression($, DFN),
    dop1_error_guard: $ => error_guard_expression($, DOP1),
    dop2_error_guard: $ => error_guard_expression($, DOP2),

    guard: $ => guard_expression($, 0),
    dfn_guard: $ => guard_expression($, DFN),
    dop1_guard: $ => guard_expression($, DOP1),
    dop2_guard: $ => guard_expression($, DOP2),

    namespace: $ => seq('(', optional(choice(
      members($, 0),
      terminator,
    )), ')'),
    dfn_namespace: $ => seq('(', members($, DFN), ')'),
    dop1_namespace: $ => seq('(', members($, DOP1), ')'),
    dop2_namespace: $ => seq('(', members($, DOP2), ')'),

    member: $ => namespace_member($, 0),
    dfn_member: $ => namespace_member($, DFN),
    dop1_member: $ => namespace_member($, DOP1),
    dop2_member: $ => namespace_member($, DOP2),

    parenthesis: $ => seq('(', _statements($, 0), ')'),
    dfn_parenthesis: $ => seq('(', _statements($, DFN), ')'),
    dop1_parenthesis: $ => seq('(', _statements($, DOP1), ')'),
    dop2_parenthesis: $ => seq('(', _statements($, DOP2), ')'),

    indices: $ => seq('[', optional(choice(
      indices($, 0),
      separator,
    )), ']'),
    dfn_indices: $ => seq('[', indices($, DFN), ']'),
    dop1_indices: $ => seq('[', indices($, DOP1), ']'),
    dop2_indices: $ => seq('[', indices($, DOP2), ']'),

    highrank: $ => seq('[', choice(
      _statements($, 0),
      terminator,
    ), ']'),
    dfn_highrank: $ => seq('[', _statements($, DFN), ']'),
    dop1_highrank: $ => seq('[', _statements($, DOP1), ']'),
    dop2_highrank: $ => seq('[', _statements($, DOP2), ']'),

    identifier: _ => identifier,
    dfn_identifier: _ => choice('⍺', '⍵', '∇'),
    dop_identifier: _ => '∇∇',
    dop1_identifier: _ => '⍺⍺',
    dop2_identifier: _ => '⍵⍵',

    string_literal: $ => seq(
      "'",
      prec(1, optional($.string_literal_content)),
      token.immediate("'"),
    ),
    string_literal_content: _ => token.immediate(stringContentLiteral),
    number_literal: _ => token(numberLiteral),
    primitive: _ => primitive,

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

function indices($$, d){
  return _separated(separator, _alias($$, 'index'), d);
}

function members($$, d){
  return _separated(terminator, _def($$, 'member'), d);
}

function namespace_member($$, d){
  const members = _alias($$, 'member_expression');
  const identifier = alias($$.identifier, $$.member_identifier);
  return seq(identifier, colon, members[d]);
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

function guard_expression($$, d){
  const conditions = _alias($$, 'guard_condition');
  const expressions = _alias($$, 'guard_expression');
  return _guard_expression($$, conditions, colon, expressions, d);
}

function error_guard_expression($$, d){
  const conditions = _alias($$, 'error_guard_condition');
  const expressions = _alias($$, 'error_guard_expression');
  return _guard_expression($$, conditions, colons, expressions, d);
}