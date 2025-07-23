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
const dfnIdentifiers = ['⍵', '⍺', '∇'];


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
    $._dop2_simple_expression,
    $._dop1_simple_expression,
    $._dfn_simple_expression,
    $._dop2_expressions,
    $._dop1_expressions,
    $._dfn_expressions,
    $._dop2_statements,
    $._dop1_statements,
    $._dfn_statements,
    $._dop2_statement_list,
    $._dop1_statement_list,
    $._dfn_statement_list,
    $._statement_list,
    $._dop2_members,
    $._dop1_members,
    $._dfn_members,
    $._dop2_member_list,
    $._dop1_member_list,
    $._dfn_member_list,
    $._member_list,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.dop2_definition, $.dop1_definition, $.dfn_definition],
    [$.dop2_definition, $.dop1_definition],
    [$.dop2_vector, $.dop1_vector, $.dfn_vector, $.vector],
    [$.dop2_vector, $.dop1_vector, $.dfn_vector],
    [$.dop2_vector, $.dop1_vector],
    [$.dop1_vector, $.dfn_vector, $.vector],
    [$.dop1_vector, $.dfn_vector],
    [$.dfn_vector, $.vector],
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
    [$._dop1_expression],
    [$._dfn_expression],
  ],

  rules: {
    source_file: $ => optional($._statement_list),

    _expression: $ => repeat1(choice(
      $._definition,
      $.parenthesis,
      $.vector,
      $.namespace,
      $.highrank,
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

    dop2_definition: $ => braced($._dop2_statement_list),
    dop1_definition: $ => braced($._dop1_statement_list),
    dfn_definition: $ => seq(
      '{',
      optional(terminator),
      repeat(seq($._dfn_statements, terminator)),
      optional($._dfn_statements),
      '}',
    ),

    _dop2_statement_list: $ => statements(
      $._dop1_statements,
      $.dop2_statement,
      $._dop2_statements,
    ),
    _dop1_statement_list: $ => statements(
      $._dfn_statements,
      $.dop1_statement,
      $._dop1_statements,
    ),
    _dfn_statement_list: $ => statements(
      $.statement,
      $.dfn_statement,
      $._dfn_statements,
    ),
    _statement_list: $ => seq(
      optional(terminator),
      $.statement,
      repeat(seq(terminator, $.statement)),
      optional(terminator),
    ),

    _dop2_statements: $ => choice($.dop2_statement, $._dop1_statements),
    _dop1_statements: $ => choice($.dop1_statement, $._dfn_statements),
    _dfn_statements: $ => choice($.dfn_statement, $.statement),

    dop2_statement: $ => $._dop2_expression,
    dop1_statement: $ => $._dop1_expression,
    dfn_statement: $ => $._dfn_expression,
    statement: $ => $._expression,

    _dop2_expression: $ => expression(
      PREC.dop2,
      $._dop1_expressions,
      $._dop2_simple_expression,
      $._dop2_expressions,
    ),
    _dop1_expression: $ => expression(
      PREC.dop1,
      $._dfn_expressions,
      $._dop1_simple_expression,
      $._dop1_expressions,
    ),
    _dfn_expression: $ => expression(
      PREC.dfn,
      $._expression,
      $._dfn_simple_expression,
      $._dfn_expressions,
    ),

    _dop2_expressions: $ => choice($._dop2_expression, $._dop1_expressions),
    _dop1_expressions: $ => choice($._dop1_expression, $._dfn_expressions),
    _dfn_expressions: $ => choice($._dfn_expression, $._expression),

    _dop2_simple_expression: $ => choice(
      $.dop2_parenthesis,
      $.dop2_vector,
      $.dop2_namespace,
      $.dop2_highrank,
      $.dop2_identifier,
    ),
    _dop1_simple_expression: $ => choice(
      $.dop1_parenthesis,
      $.dop1_vector,
      $.dop1_namespace,
      $.dop1_highrank,
      $.dop1_identifier,
    ),
    _dfn_simple_expression: $ => choice(
      $.dfn_parenthesis,
      $.dfn_vector,
      $.dfn_namespace,
      $.dfn_highrank,
      choice($.dop_identifier, $.dfn_identifier),
    ),

    dop2_parenthesis: $ => prec(1, parenthesized($._dop2_expression)),
    dop1_parenthesis: $ => prec(1, parenthesized($._dop1_expression)),
    dfn_parenthesis: $ => prec(1, parenthesized($._dfn_expression)),
    parenthesis: $ => prec(1, parenthesized($._expression)),

    dop2_vector: $ => parenthesized($._dop2_statement_list),
    dop1_vector: $ => parenthesized($._dop1_statement_list),
    dfn_vector: $ => parenthesized($._dfn_statement_list),
    vector: $ => parenthesized($._statement_list),

    dop2_namespace: $ => prec(2, parenthesized($._dop2_member_list)),
    dop1_namespace: $ => prec(2, parenthesized($._dop1_member_list)),
    dfn_namespace: $ => prec(2, parenthesized($._dfn_member_list)),
    namespace: $ => prec(2, parenthesized($._member_list)),

    _dop2_member_list: $ => statements(
      $._dop1_members,
      $.dop2_member,
      $._dop2_members,
    ),
    _dop1_member_list: $ => statements(
      $._dfn_members,
      $.dop1_member,
      $._dop1_members,
    ),
    _dfn_member_list: $ => statements(
      $.member,
      $.dfn_member,
      $._dfn_members,
    ),
    _member_list: $ => seq(
      optional(terminator),
      $.member,
      repeat(seq(terminator, $.member)),
      optional(terminator),
    ),

    _dop2_members: $ => choice($.dop2_member, $._dop1_members),
    _dop1_members: $ => choice($.dop1_member, $._dfn_members),
    _dfn_members: $ => choice($.dfn_member, $.member),

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

    dop2_highrank: $ => bracketed($._dop2_statement_list),
    dop1_highrank: $ => bracketed($._dop1_statement_list),
    dfn_highrank: $ => bracketed($._dfn_statement_list),
    highrank: $ => bracketed($._statement_list),

    dop2_identifier: _ => dop2Identifier,
    dop1_identifier: _ => dop1Identifier,
    dop_identifier: _ => dopIdentifier,
    dfn_identifier: _ => choice(...dfnIdentifiers),
    identifier: _ => /[a-zA-ZⒶ-Ⓩ_∆⍙][a-zA-ZⒶ-Ⓩ_∆⍙0-9]*/,

    string_literal: $ => seq(
      "'",
      // alias(token.immediate(prec(1, /[^'\n]*(''[^'\n]*)*/)), $.string_literal_content),
      optional(alias(token.immediate(prec(1, /(''|[^'\n])+/)), $.string_literal_content)),
      token.immediate("'"),
    ),

    number_literal: _ => token(numberLiteral),

    primitive: _ => /[-←+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍞⎕⍠⌸⌺⌶⍎⍕→&⍬]/,

    comment: _ => token(seq('⍝', /.*/)),
  },
});

function statements(prev_statements, statement, statements){
  return seq(
    optional(terminator),
    repeat(seq(prev_statements, terminator)),
    statement,
    repeat(seq(terminator, statements)),
    optional(terminator),
  );
}

function expression(p, prev_expression, expression, expressions){
  return prec(p, seq(
    optional(prev_expression),
    expression,
    optional(expressions),
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