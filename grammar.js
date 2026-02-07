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

const del = '∇';
const primitive = /[-+×÷*⍟⌹○!?|⌈⌊⊥⊤⊣⊢=≠≤<>≥≡≢∨∧⍲⍱↑↓⊂⊃⊆⌷⍋⍒⍳⍸∊⍷∪∩~\/⌿⍀.,⍪⍴⌽⊖⍉¨⍨⍣∘⍛⍤⍥@⍠⌸⌺⌶⍎⍕&⍬]/;

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
    // dop identifiers
    '⍺⍺', '⍵⍵', '∇∇',
    // system commands
    $._system_command,
    // ilegal tokens
    $._invalid,
    // control words
    $.goto,
    $.if, $.elseif, $.else, $.endif,
    $.select, $.case, $.caselist, $.endselect,
    // $.trap, $.endtrap,
    $.hold, $.endhold,
    $.section, $.endsection,
    $.with, $.endwith,
    $.disposable, $.enddisposable,
    $.while, $.endwhile, $.repeat, $.until,
    $.for, $.in, $.ineach, $.endfor,
    $.andif, $.orif, $.end,
    $.continue, $.leave, $.return,
  ],

  supertypes: $ => [
    $.definition,
    $.trad,
    $.block,
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
    [$._expression],
    [$._dfn_expression],
    [$._dop1_expression],
    [$.tradop2, $.tradop1, $.tradfn],
    [$.tradop2, $.tradop1, $.tradfn, $._expression],
    [$.tradfn, $._expression],
    [$.tradfn],
    [$._statement_list],
    [$._loop_statement_list],
    [$._loop_statement_list, $._statement_list],
    [$._loop_if_block, $.if_block],
    [$._loop_select_block, $.select_block],
    [$._loop_hold_block, $.hold_block],
    [$._loop_section_block, $.section_block],
    [$._loop_with_block, $.with_block],
    [$._loop_disposable_block, $.disposable_block],
    [$.select_block],
    [$._loop_select_block],
    [$._until],
  ],

  rules: {
    // a source_file is the whole code,
    // it might be a file or a code fragment
    source_file: $ => optional(choice(
      $._statement_list,
      $.trad,
      terminator,
    )),

    // traditional definitions
    trad: $ => choice($.tradfn, $.tradop1, $.tradop2),
    tradfn: $ => trad_def($, DFN),
    tradop1: $ => trad_def($, DOP1),
    tradop2: $ => trad_def($, DOP2),
    // statements inside trad-defs
    block: $ => choice(
      $.if_block,
      $.select_block,
      // $.trap_block,
      $.hold_block,
      $.section_block,
      $.with_block,
      $.disposable_block,
      $.while_block,
      $.repeat_block,
      $.for_block,
    ),
    _trad_stataments: $ => choice(
      alias(trad_statement($, $._expression), $.statement),
      $.block,
      $.branch_statement,
      $.goto_statement,
      $.return_statement,
    ),
    _loop_statement_list: $ => _separated(terminator, [choice(
      $._trad_stataments,
      alias($._loop_if_block, $.if_block),
      alias($._loop_select_block, $.select_block),
      // alias($._loop_trap_block, $.trap_block),
      alias($._loop_hold_block, $.hold_block),
      alias($._loop_section_block, $.section_block),
      alias($._loop_with_block, $.with_block),
      alias($._loop_disposable_block, $.disposable_block),
      $.leave_statement,
      $.continue_statement,
    )], 0),
    _statement_list: $ => _separated(terminator, [$._trad_stataments], 0),
    // control structures
    ...block_rules(),
    while_block: $ => seq(
      $.while_statement,
      choice(
        repeat(seq(terminator, $.andif_statement)),
        repeat(seq(terminator, $.orif_statement)),
      ),
      optional(seq(terminator, $._loop_statement_list)),
      choice(
        $._until,
        seq(
          terminator, $.endwhile_statement,
        ),
      ),
    ),
    repeat_block: $ => seq(
      $.repeat_statement,
      optional(seq(terminator, $._loop_statement_list)),
      $._until,
    ),
    _until: $ => seq(
      terminator, $.until_statement,
      choice(
        repeat(seq(terminator, $.andif_statement)),
        repeat(seq(terminator, $.orif_statement)),
      ),
    ),
    for_block: $ => seq(
      $.for_statement,
      optional(seq(terminator, $._loop_statement_list)),
      terminator, $.endfor_statement,
    ),
    // control statements
    branch_statement: $ => trad_statement($, seq($.right_arrow, $._expression)),
    goto_statement: $ => trad_statement($, seq($.goto, $._expression)),
    if_statement: $ => trad_statement($, condition_statement($, 'if')),
    andif_statement: $ => trad_statement($, condition_statement($, 'andif')),
    orif_statement: $ => trad_statement($, condition_statement($, 'orif')),
    elseif_statement: $ => trad_statement($, condition_statement($, 'elseif')),
    else_statement: $ => trad_statement($, $.else),
    endif_statement: $ => trad_statement($, choice($.endif, $.end)),
    select_statement: $ => trad_statement($, seq($.select, $._expression)),
    case_statement: $ => trad_statement($, seq($.case, $._expression)),
    caselist_statement: $ => trad_statement($, seq($.caselist, $._expression)),
    endselect_statement: $ => trad_statement($, choice($.endselect, $.end)),
    hold_statement: $ => trad_statement($, seq($.hold, $._expression)),
    endhold_statement: $ => trad_statement($, choice($.endhold, $.end)),
    section_statement: $ => trad_statement($, seq($.section, $.identifier)),
    endsection_statement: $ => trad_statement($, choice($.endsection, $.end)),
    with_statement: $ => trad_statement($, seq($.with, $._expression)),
    endwith_statement: $ => trad_statement($, choice($.endwith, $.end)),
    disposable_statement: $ => trad_statement($, seq($.disposable, $._expression)),
    enddisposable_statement: $ => trad_statement($, choice($.enddisposable, $.end)),
    while_statement: $ => trad_statement($, condition_statement($, 'while')),
    until_statement: $ => trad_statement($, condition_statement($, 'until')),
    endwhile_statement: $ => trad_statement($, choice($.endwhile, $.end)),
    repeat_statement: $ => trad_statement($, $.repeat),
    for_statement: $ => trad_statement($, seq(
      $.for,
      repeat1(field('control_var', $.identifier)),
      choice($.in, $.ineach),
      field('control_array', $._expression),
    )),
    endfor_statement: $ => trad_statement($, choice($.endfor, $.end)),
    continue_statement: $ => trad_statement($, $.continue),
    leave_statement: $ => trad_statement($, $.leave),
    return_statement: $ => trad_statement($, $.return),

    // an _expression is any non-dfn/dop valid expression
    _expression: $ => choice(
      expression($, 0,
        $.definition,
        ...literals.map(l => $[l + '_literal']),
        $.system_command,
        $.primitive,
      ),
      $.assignment,
    ),
    // an _expression becomes a _dfn_expression with one of ⍺,⍵,∇,∇∇
    // (∇∇ is valid in dfns, it will produce a SYNTAX ERROR when run)
    _dfn_expression: $ => expression($, DFN, $.dop_identifier),
    _dop1_expression: $ => expression($, DOP1), // expression with ⍺⍺
    _dop2_expression: $ => expression($, DOP2), // expression with ⍵⍵

    // quad-commands returned by external scanner
    system_command: $ => $._system_command,

    // call factory function to generate rules for definitions
    ...def_rules(),

    // user defined identifiers
    identifier: _ => identifier,
    // predefined identifiers allowed inside definitions
    dfn_identifier: _ => choice('⍺', '⍵', '∇'),
    dop_identifier: _ => '∇∇', // allowed inside dfn!
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
    left_arrow: _ => '←',
    right_arrow: _ => '→',

    // ilumination
    comment: _ => token(seq(lamp, /.*/)),
  },
});

function defs(name) {
  const prefixes = ['', 'dfn_', 'dop1_', 'dop2_'];
  const private = name[0] == '_' ? '_' : '';
  const base = name[0] == '_' ? name.substring(1) : name;
  return prefixes.map((prefix) => [private + prefix + base]);
}

function _defs($$, name) {
  const d = defs(name);
  return d.map((di) => $$[di]);
}

function _alias($$, name){
  const expressions = _defs($$, '_expression');
  const aliases = _defs($$, name);
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
  const _assignment = _defs($$, 'assignment')[d];
  const expression = choice(
    ...expressions.map((expression) => $$[prefix + expression]),
    ...extra,
  );
  if (d == 0)
    return repeat1(choice(expression, _assignment));
  const _expressions = _choice(_defs($$, '_expression'));
  return choice(
    seq(
      optional(_expressions[d-1]),
      expression,
      prec(1, optional(_expressions[d])),
    ),
    _assignment,
  );
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

function trad_statement($$, statement){
    return choice(
      statement,
      seq(
        alias($$.identifier, $$.label),
        ':',
        statement,
      ),
    );
}

function block_rules(){
  function block(name){
    return ($, statement_list) => seq(
      $[name + '_statement'],
      optional(seq(terminator, statement_list)),
      terminator, $['end' + name + '_statement'],
    );
  }
  const rules = {
    if_block: ($, statement_list) => seq(
      $.if_statement,
      repeat(seq(
        choice(
          repeat(seq(terminator, $.andif_statement)),
          repeat(seq(terminator, $.orif_statement)),
        ),
        optional(seq(terminator, statement_list)),
        terminator, $.elseif_statement,
      )),
      choice(
        repeat(seq(terminator, $.andif_statement)),
        repeat(seq(terminator, $.orif_statement)),
      ),
      optional(seq(
        optional(seq(terminator, statement_list)),
        terminator, $.else_statement,
      )),
      optional(seq(terminator, statement_list)),
      terminator, $.endif_statement,
    ),
    select_block: ($, statement_list) => prec.right(seq(
      $.select_statement,
      repeat(seq(
        terminator, choice(
          $.case_statement,
          $.caselist_statement
        ),
        optional(seq(terminator, statement_list)),
      )),
      optional(seq(
        terminator, choice(
          $.case_statement,
          $.caselist_statement,
          $.else_statement,
        ),
        optional(seq(terminator, statement_list)),
      )),
      terminator, $.endselect_statement,
    )),
    // trap_block,
    hold_block: block('hold'),
    section_block: block('section'),
    with_block: block('with'),
    disposable_block: block('disposable'),
  }
  const keys = Object.keys(rules);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let fn = rules[k];
    rules[k] = $ => fn($, $._statement_list);
    rules['_loop_' + k] = $ => fn($, $._loop_statement_list);
  }
  return rules;
}

function statements($$, d){
  return _separated(terminator, _alias($$, 'statement'), d);
}

function _statements($$, d){
  return _separated(terminator, _defs($$, '_statement'), d);
}

function _left_right(left, middle, right, d){
  if (d == 0)
    return prec.right(seq(left[0], middle, right[0]));
  const _left = _choice(left);
  const _right = _choice(right);
  return choice(
    prec.right(seq(_left[d-1], middle, right[d])),
    prec.right(seq(left[d], middle, _right[d])),
  );
}

function trad_def($$, d) {
  var center = [field('name', $$.identifier)];
  if (d > DFN) {
    center.splice(0, 0, '(', field('left_op', $$.identifier));
    if (d == DOP2) {
      center.push(field('right_op', $$.identifier));
    }
    center.push(')');
  }
  const trad_header = seq(
    optional(field('result', seq(
      choice(
        $$.identifier,
        seq('(', repeat1($$.identifier), ')'),
        seq('{', $$.identifier, '}'),
      ),
      $$.left_arrow,
    ))),
    optional(field('left_arg', choice(
      $$.identifier,
      seq('(', repeat1($$.identifier), ')'),
      seq('{', $$.identifier, '}'),
    ))),
    ...center,
    optional(field('right_arg', choice(
      $$.identifier,
      seq('(', repeat1($$.identifier), ')'),
    ))),
    repeat(seq(repeat1(';'), field('local', $$.identifier))),
    repeat(';'),
  );
  return seq(
    optional(del),
    trad_header,
    newline,
    optional(field('body', $$._statement_list)),
    optional(del),
  );
}

function condition_statement($$, name) {
  return seq(
    $$[name],
    alias($$._expression, $$[name + '_condition']),
  );
}

function def_rules() {
  const rules = {
    // statements inside definitions can be expressions,
    // guards or error guards
    _statement($$, d) {
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
    },
    // assignments have a left and a right expression
    assignment($$, d) {
      const left = _alias($$, 'assign_left');
      const right = _alias($$, 'assign_right');
      return _left_right(left, $$.left_arrow, right, d);
    },
    // a definition is a braced statement list
    definition($$, d) {
      // definition supertype
      if (d == 0) return choice(
        $$.dfn_definition,
        $$.dop1_definition,
        $$.dop2_definition,
      );
      // by default, definitions are function definitions
      if (d == 1) return seq('{', optional(choice(
        _statements($$, DFN),
        _statements($$, 0),
        terminator,
      )), '}');
      // if a definition includes a dop1 or dop2 expression, it's a dop definition
      return seq('{', _statements($$, d), '}');
    },
    // condition guards can include definition expressions either as
    // condition (guard_condition) or as return expression (guard_expression)
    guard($$, d) {
      const conditions = _alias($$, 'guard_condition');
      const expressions = _alias($$, 'guard_expression');
      return _left_right(conditions, colon, expressions, d);
    },
    // error guards can also include definition expressions either as
    // condition (error_guard_condition) or as return expression (error_guard_expression)
    error_guard($$, d) {
      const conditions = _alias($$, 'error_guard_condition');
      const expressions = _alias($$, 'error_guard_expression');
      return _left_right(conditions, colons, expressions, d);
    },
    // a namespace includes members separated by terminators, or could be empty
    namespace($$, d) {
      const members = _separated(terminator, _defs($$, 'member'), d);
      if (d == 0) return seq('(', optional(choice(
        members,
        terminator,
      )), ')');
      return seq('(', members, ')');
    },
    // namespace members can be definition expressions
    member($$, d) {
      const members = _alias($$, 'member_expression');
      const identifier = alias($$.identifier, $$.member_identifier);
      return seq(identifier, colon, members[d]);
    },
    // a parenthesis might be a parenthesized expression
    // or an APLAN vector definition (if there are separators)
    parenthesis($$, d) {
      return seq('(', statements($$, d), ')')
    },
    // indices might be separated by separators (;) or not
    indices($$, d) {
      const indices = _separated(separator, _alias($$, 'index'), d);
      if (d == 0) return seq('[', optional(choice(
        indices,
        separator,
      )), ']');
      return seq('[', indices, ']');
    },
    // highrank APLAN definitions look like indices, but always
    // include a separator
    highrank($$, d) {
      if (d == 0) return seq('[', optional(choice(
        statements($$, 0),
        terminator,
      )), ']');
      return seq('[', statements($$, d), ']');
    },
  };
  const keys = Object.keys(rules);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let fn = rules[k];
    let d = defs(k);
    for (let j = 0; j < d.length; j++) {
      rules[d[j]] = $ => fn($, j);
    }
  }
  return rules;
}
