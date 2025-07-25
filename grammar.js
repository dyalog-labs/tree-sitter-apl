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

    dop2_statement: $ => prec.right($._dop2_expression),
    dop1_statement: $ => prec.right($._dop1_expression),
    dfn_statement: $ => prec.right($._dfn_expression),
    statement: $ => prec.right($._expression),

    _expression: $ => repeat1(choice(
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
    )),

    dop2_definition: $ => braced(statements($, DOP2)),
    dop1_definition: $ => braced(statements($, DOP1)),
    dfn_definition: $ => braced(optional(choice(
      statements($, DFN),
      statements($, 0),
      terminator,
    ))),

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

    dop2_namespace: $ => parenthesized(members($, DOP2)),
    dop1_namespace: $ => parenthesized(members($, DOP1)),
    dfn_namespace: $ => parenthesized(members($, DFN)),
    namespace: $ => parenthesized(seq(
      optional(terminator),
      $.member,
      repeat(seq(terminator, $.member)),
      optional(terminator),
    )),

    dop2_member: $ => namespace_member(
      alias($.identifier, $.dop2_member_identifier),
      alias($._dop2_expression, $.dop2_member_expression),
    ),
    dop1_member: $ => namespace_member(
      alias($.identifier, $.dop1_member_identifier),
      alias($._dop1_expression, $.dop1_member_expression),
    ),
    dfn_member: $ => namespace_member(
      alias($.identifier, $.dfn_member_identifier),
      alias($._dfn_expression, $.dfn_member_expression),
    ),
    member: $ => namespace_member(
      alias($.identifier, $.member_identifier),
      alias($._expression, $.member_expression),
    ),

    dop2_parenthesis: $ => parenthesized(statements($, DOP2)),
    dop1_parenthesis: $ => parenthesized(statements($, DOP1)),
    dfn_parenthesis: $ => parenthesized(statements($, DFN)),
    parenthesis: $ => parenthesized(statements($, 0)),

    dop2_indices: $ => bracketed(indices($, DOP2)),
    dop1_indices: $ => bracketed(indices($, DOP1)),
    dfn_indices: $ => bracketed(indices($, DFN)),
    indices: $ => bracketed(optional(choice(indices($, 0), separator))),

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

function choice4(choices){
  const c0 = choices[0];
  const c1 = choice(choices[1], c0);
  const c2 = choice(choices[2], c1);
  const c3 = choice(choices[3], c2);
  return [c0, c1, c2, c3];
}

function separated(separator, statements, p){
  if (p == 0) return seq(
    optional(separator),
    statements[0],
    repeat(seq(separator, statements[0])),
    optional(separator),
  );
  const _statements = choice4(statements);
  return seq(
    optional(separator),
    optional(seq(_statements[p-1], separator)),
    prec(1, statements[p]),
    repeat(seq(separator, _statements[p])),
    optional(separator),
  );
}

function statements($$, p){
  const statements = [$$.statement, $$.dfn_statement, $$.dop1_statement, $$.dop2_statement];
  return separated(terminator, statements, p);
}

function indices($$, p){
  const expressions = [
    alias($$._expression, $$.index),
    alias($$._dfn_expression, $$.dfn_index),
    alias($$._dop1_expression, $$.dop1_index),
    alias($$._dop2_expression, $$.dop2_index),
  ];
  return separated(separator, expressions, p);
}

function members($$, p){
  const members = [$$.member, $$.dfn_member, $$.dop1_member, $$.dop2_member];
  return separated(terminator, members, p);
}

function expression($$, p, simple_expression){
  const expressions = [$$._expression, $$._dfn_expression, $$._dop1_expression, $$._dop2_expression];
  const _expressions = choice4(expressions);
  return prec.right(seq(
    optional(_expressions[p-1]),
    prec(1, simple_expression),
    optional(_expressions[p]),
  ));
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

function namespace_member(identifier, expression){
  return seq(identifier, ':', expression);
}