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

const dop2Identifier = '⍵⍵';
const dop1Identifier = '⍺⍺';
const dopIdentifier = '∇∇';
const dfnIdentifiers = ['⍵', '⍺', '∇'];

const newline = /\n/;
const terminator = repeat1(choice(newline, '⋄', '\0'));
const separator = repeat1(';');

const colon = ':';
const colons = '::';

const digits = /[0-9]+/;
const signed = seq(optional("¯"), digits);
const decimal = seq(signed, optional(seq(".", optional(digits))));
const exponent = seq(choice("E", "e"), optional("¯"), digits);
const real = seq(decimal, optional(exponent));
const imaginary = seq(choice("J", "j"), real);
const numberLiteral = seq(real, optional(imaginary));

module.exports = grammar({
  name: 'apl',

  extras: $ => [
    $.comment,
    /\s/,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => optional(statements($, 0)),

    _dop2_statement: $ => prec.right(choice(
      $.dop2_error_guard,
      $.dop2_guard,
      alias($._dop2_expression, $.dop2_statement),
    )),
    _dop1_statement: $ => prec.right(choice(
      $.dop1_error_guard,
      $.dop1_guard,
      alias($._dop1_expression, $.dop1_statement),
    )),
    _dfn_statement: $ => prec.right(choice(
      $.dfn_error_guard,
      $.dfn_guard,
      alias($._dfn_expression, $.dfn_statement),
    )),
    _statement: $ => prec.right(choice(
      $.error_guard,
      $.guard,
      alias($._expression, $.statement),
    )),

    _dop2_expression: $ => expression($, DOP2, choice(
      $.dop2_namespace,
      $.dop2_indices,
      $.dop2_parenthesis,
      $.dop2_highrank,
      $.dop2_identifier,
    )),
    _dop1_expression: $ => expression($, DOP1, choice(
      $.dop1_namespace,
      $.dop1_indices,
      $.dop1_parenthesis,
      $.dop1_highrank,
      $.dop1_identifier,
    )),
    _dfn_expression: $ => expression($, DFN, choice(
      $.dfn_namespace,
      $.dfn_indices,
      $.dfn_parenthesis,
      $.dfn_highrank,
      choice($.dop_identifier, $.dfn_identifier),
    )),
    _expression: $ => repeat1(prec.right(choice(
      $.dop2_definition,
      $.dop1_definition,
      $.dfn_definition,
      $.namespace,
      $.indices,
      $.parenthesis,
      $.highrank,
      $.identifier,
      $.string_literal,
      $.number_literal,
      $.primitive,
    ))),

    dop2_definition: $ => braced(statements($, DOP2)),
    dop1_definition: $ => braced(statements($, DOP1)),
    dfn_definition: $ => braced(optional(choice(
      statements($, DFN),
      statements($, 0),
      terminator,
    ))),

    dop2_error_guard: $ => error_guard_expression($, DOP2),
    dop1_error_guard: $ => error_guard_expression($, DOP1),
    dfn_error_guard: $ => error_guard_expression($, DFN),
    error_guard: $ => error_guard_expression($, 0),

    dop2_guard: $ => guard_expression($, DOP2),
    dop1_guard: $ => guard_expression($, DOP1),
    dfn_guard: $ => guard_expression($, DFN),
    guard: $ => guard_expression($, 0),

    dop2_namespace: $ => parenthesized(members($, DOP2)),
    dop1_namespace: $ => parenthesized(members($, DOP1)),
    dfn_namespace: $ => parenthesized(members($, DFN)),
    namespace: $ => parenthesized(optional(choice(
      members($, 0),
      terminator,
    ))),

    dop2_member: $ => namespace_member($, DOP2),
    dop1_member: $ => namespace_member($, DOP1),
    dfn_member: $ => namespace_member($, DFN),
    member: $ => namespace_member($, 0),

    dop2_parenthesis: $ => parenthesized(statements($, DOP2)),
    dop1_parenthesis: $ => parenthesized(statements($, DOP1)),
    dfn_parenthesis: $ => parenthesized(statements($, DFN)),
    parenthesis: $ => parenthesized(statements($, 0)),

    dop2_indices: $ => bracketed(indices($, DOP2)),
    dop1_indices: $ => bracketed(indices($, DOP1)),
    dfn_indices: $ => bracketed(indices($, DFN)),
    indices: $ => bracketed(optional(choice(
      indices($, 0),
      separator,
    ))),

    dop2_highrank: $ => bracketed(statements($, DOP2)),
    dop1_highrank: $ => bracketed(statements($, DOP1)),
    dfn_highrank: $ => bracketed(statements($, DFN)),
    highrank: $ => bracketed(statements($, 0)),

    dop2_identifier: _ => dop2Identifier,
    dop1_identifier: _ => dop1Identifier,
    dop_identifier: _ => dopIdentifier,
    dfn_identifier: _ => choice(...dfnIdentifiers),
    identifier: _ => /[a-zA-ZⒶ-Ⓩ_∆⍙][a-zA-ZⒶ-Ⓩ_∆⍙0-9]*/,
    string_literal: $ => seq(
      "'",
      optional(alias(token.immediate(prec(1, /(''|[^'\n])+/)), $.string_literal_content)),
      token.immediate("'"),
    ),
    number_literal: _ => token(numberLiteral),
    primitive: _ => /[-←+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍞⎕⍠⌸⌺⌶⍎⍕→&⍬]/,

    comment: _ => token(seq('⍝', /.*/)),
  },
});

function def(name) {
  const prefixes = ['dfn', 'dop1', 'dop2'];
  const private = name[0] == '_' ? '_' : '';
  const base = name[0] == '_' ? name : '_' + name;
  return $ => {
    const rules = [$[name]];
    for (const prefix of prefixes) {
      rules.push($[private + prefix + base]);
    }
    return rules;
  };
}

function aliased($$, name){
  const expressions = def('_expression')($$);
  const aliases = def(name)($$);
  return expressions.map((elem, i) => alias(elem, aliases[i]));
}

function choice4(choices){
  const c0 = choices[0];
  const c1 = choice(choices[1], c0);
  const c2 = choice(choices[2], c1);
  const c3 = choice(choices[3], c2);
  return [c0, c1, c2, c3];
}

function separated(separator, statements, d){
  if (d == 0)
    return seq(
      optional(separator),
      statements[0],
      repeat(seq(separator, statements[0])),
      optional(separator),
    );
  const _statements = choice4(statements);
  return seq(
    optional(separator),
    optional(seq(_statements[d-1], separator)),
    prec(1, statements[d]),
    repeat(seq(separator, _statements[d])),
    optional(separator),
  );
}

function statements($$, d){
  return separated(terminator, def('_statement')($$), d);
}

function indices($$, d){
  const indices = aliased($$, 'index');
  return separated(separator, indices, d);
}

function members($$, d){
  return separated(terminator, def('member')($$), d);
}

function expression($$, d, simple_expression){
  const _expressions = choice4(def('_expression')($$));
  return prec.right(seq(
    optional(_expressions[d-1]),
    prec(1, simple_expression),
    optional(_expressions[d]),
  ));
}

function _guard_expression($$, conditions, colon, expressions, d){
  if (d == 0)
    return seq(conditions[0], colon, expressions[0]);
  const _expressions = choice4(expressions);
  const _conditions = choice4(conditions);
  return choice(
    seq(_conditions[d-1], colon, expressions[d]),
    seq(conditions[d], colon, _expressions[d]),
  );
}

function guard_expression($$, d){
  const conditions = aliased($$, 'guard_condition');
  const expressions = aliased($$, 'guard_expression');
  return _guard_expression($$, conditions, colon, expressions, d);
}

function error_guard_expression($$, d){
  const conditions = aliased($$, 'error_guard_condition');
  const expressions = aliased($$, 'error_guard_expression');
  return _guard_expression($$, conditions, colons, expressions, d);
}

function namespace_member($$, d){
  const members = aliased($$, 'member_expression');
  const identifier = alias($$.identifier, $$.member_identifier);
  return seq(identifier, colon, members[d]);
}

function braced(content){
  return seq('{', content, '}');
}

function parenthesized(content){
  return seq('(', content, ')');
}

function bracketed(content){
  return seq('[', content, ']');
}