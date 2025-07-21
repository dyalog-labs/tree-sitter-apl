/**
 * @file APL Tree-sitter
 * @author Jesús Galán López (yiyus) <jgl@dyalog.com>
 * @license MIT
 */

module.exports = grammar({
  name: "apl",

  extras: $ => [' ', "\t", "\r", $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => optional($._statements),

    _statements: $ => seq(
      optional($._brk),
      $.statement,
      repeat(seq($._brk, $.statement)),
      optional($._brk),
    ),
    statement: $ => repeat1($._token),

    _token: $ => choice(
      $.identifier, $.string, $.number,
      $.primitive,
    ),
    identifier: _ => /[a-zA-ZⒶ-Ⓩ_∆⍙][a-zA-ZⒶ-Ⓩ_∆⍙0-9]*/,
    string: $ => seq(
      "'",
      alias(/[^'\n]*(''[^'\n]*)*/, $.string_fragment),
      "'"
    ),
    number: _ => {
      const digits = /[0-9]+/;
      const signed = seq(optional("¯"), digits);
      const decimal = seq(signed, optional(seq(".", optional(digits))));
      const exponent = seq(choice("E", "e"), optional("¯"), digits);
      const real = seq(decimal, optional(exponent));
      const imaginary = seq(choice("J", "j"), real);
      return token(seq(real, optional(imaginary)));
    },
    primitive: _ => /[-←+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍞⎕⍠⌸⌺⌶⍎⍕→&⍬]/,

    _brk: _ => repeat1(choice('⋄', "\n")),

    comment: _ => seq('⍝', /.*/),
  },
});
