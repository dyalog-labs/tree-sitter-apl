/**
 * @file APL Tree-sitter
 * @author Jesús Galán López (yiyus) <jgl@dyalog.com>
 * @license MIT
 */

/** /// <reference types="tree-sitter-cli/dsl" />
// @ts-check */

const PREC = {
  dop2: 3,
  dop1: 2,
  dfn: 1,
};

const dop2Identifier = '⍵⍵';
const dop1Identifier = '⍺⍺';
const dopIdentifier = '∇∇';
const dfnIdentifiers = ['⍵', '⍺', '∇', dopIdentifier];


const newline = /\n/;
const terminator = repeat1(choice(newline, '⋄', '\0'));

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

  inline: $ => [
    $._dop2_statements,
    $._dop1_statements,
    $._dfn_statements,
    $._dop2_expressions,
    $._dop1_expressions,
    $._dfn_expressions,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.dop2_definition, $.dop1_definition, $.dfn_definition],
    [$.dop2_definition, $.dop1_definition],
  ],

  rules: {
    source_file: $ => seq(
      optional(terminator),
      repeat(seq($.statement, terminator)),
      optional($.statement),
    ),

    dop2_statement: $ => $._dop2_expression,
    dop1_statement: $ => $._dop1_expression,
    dfn_statement: $ => $._dfn_expression,
    statement: $ => $._expression,

    _expression: $ => repeat1(choice(
      $._definition,
      // $.parenthesis,
      // $.namespace,
      // $.bracket,
      // $.indexed,
      $.identifier,
      $.string_literal,
      $.number_literal,
      $.primitive,
    )),

    _definition: $ => choice(
      $.dop2_definition,
      $.dop1_definition,
      $.dfn_definition,
    ),

    dop2_definition: $ => seq(
      '{',
      optional(terminator),
      repeat(seq($._dop1_statements, terminator)),
      $.dop2_statement,
      repeat(seq(terminator, $._dop2_statements)),
      '}',
    ),
    _dop2_statements: $ => choice(
      $.dop2_statement,
      $._dop1_statements,
    ),

    dop1_definition: $ => seq(
      '{',
      optional(terminator),
      repeat(seq($._dfn_statements, terminator)),
      $.dop1_statement,
      repeat(seq(terminator, $._dop1_statements)),
      '}',
    ),
    _dop1_statements: $ => choice(
      $.dop1_statement,
      $._dfn_statements,
    ),

    dfn_definition: $ => seq(
      '{',
      optional(terminator),
      repeat(seq($._dfn_statements, terminator)),
      optional($._dfn_statements),
      '}',
    ),
    _dfn_statements: $ => choice(
        $.dfn_statement,
        $.statement,
    ),

    _dop2_expression: $ => prec(PREC.dop2, seq(
      optional($._dop1_expressions),
      $.dop2_identifier,
      optional($._dop2_expressions),
    )),
    _dop2_expressions: $ => choice(
      $._dop2_expression,
      $._dop1_expressions,
    ),

    _dop1_expression: $ => prec(PREC.dop1, seq(
      optional($._dfn_expressions),
      $.dop1_identifier,
      optional($._dop1_expressions),
    )),
    _dop1_expressions: $ => choice(
      $._dop1_expression,
      $._dfn_expressions,
    ),

    _dfn_expression: $ => prec(PREC.dfn, seq(
      optional($._expression),
      $.dfn_identifier,
      optional($._dfn_expressions),
    )),
    _dfn_expressions: $ => choice(
      $._dfn_expression,
      $._expression,
    ),

    dop2_identifier: _ => dop2Identifier,
    dop1_identifier: _ => dop1Identifier,
    dfn_identifier: _ => choice(...dfnIdentifiers),
    identifier: _ => /[a-zA-ZⒶ-Ⓩ_∆⍙][a-zA-ZⒶ-Ⓩ_∆⍙0-9]*/,

    string_literal: $ => seq(
      "'",
      // alias(token.immediate(prec(1, /[^'\n]*(''[^'\n]*)*/)), $.string_literal_content),
      optional(alias(token.immediate(prec(1, /(''|[^'\n])+/)), $.string_literal_content)),
      token.immediate("'")
    ),

    number_literal: _ => token(numberLiteral),

    primitive: _ => /[-←+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍞⎕⍠⌸⌺⌶⍎⍕→&⍬]/,

    comment: _ => token(seq('⍝', /.*/)),
  },
});
