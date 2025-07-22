/**
 * @file APL Tree-sitter
 * @author Jesús Galán López (yiyus) <jgl@dyalog.com>
 * @license MIT
 */

const PREC = {
  dop2: 3,
  dop1: 2,
  dfn: 1,
}

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
  name: "apl",

  extras: $ => [
    $.comment,
    /\s/,
  ],

  inline: $ => [
    $._simple_expression,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
  ],

  rules: {
    source_file: $ => seq(
      repeat(seq($._statement, terminator)),
      optional($._statement),
    ),

    _statement: $ => choice(
      $.expression_statement,
    ),

    expression_statement: $ => $._expression,

    _expression: $ => repeat1(prec.right($._simple_expression)),

    _simple_expression: $ => choice(
      // $.parenthesis,
      // $.namespace,
      // $.bracket,
      // $.indexed,
      $.identifier,
      $.string_literal,
      $.number_literal,
      $.primitive,
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
