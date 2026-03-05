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
  'namespace_literal',
  'parenthesis',
  'highrank',
  'indices',
  'identifier',
];

const body_statements = [
  'namespace_script',
  'class_definition',
  'interface_definition',
  'access_statement',
  'attribute_statement',
  'implements_statement',
  'signature_statement',
];

const body_target_statements = [
  'branch_statement',
  'goto_statement',
  'return_statement',
];

const body_loop_statements = [
  'continue_statement',
  'leave_statement',
];

const blocks = [
  'if_block',
  'select_block',
  'trap_block',
  'hold_block',
  'section_block',
  'with_block',
  'disposable_block',
];

const loop_blocks = [
  'while_block',
  'repeat_block',
  'for_block',
];

const control = [
  'goto',
  'if', 'elseif', 'else', 'endif',
  'select', 'case', 'caselist', 'endselect',
  'trap', 'endtrap',
  'hold', 'endhold',
  'section', 'endsection',
  'with', 'endwith',
  'disposable', 'enddisposable',
  'while', 'endwhile', 'repeat', 'until',
  'for', 'in', 'ineach', 'endfor',
  'andif', 'orif', 'end',
  'continue', 'leave', 'return',
  'namespace', 'endnamespace',
  'class', 'endclass',
  'field', 'include', 'using',
  'interface', 'endinterface',
  'property', 'endproperty',
  'require', 'attribute', 'signature', 'implements', 'access',
];

module.exports = grammar({
  name: 'apl',

  extras: $ => [
    $.comment,
    /\s/,
  ],

  word: $ => $.identifier,

  externals: $ => [
    '⍺⍺', '⍵⍵', '∇∇',  // dop identifiers
    $._system_command,
    $._invalid,  // ilegal tokens
    ... control.map(word => $[word]), // control words
  ],

  supertypes: $ => [
    $.control,
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
    [$.dop2_namespace_literal, $.dop1_namespace_literal, $.dfn_namespace_literal, $.namespace_literal],
    [$.dop2_namespace_literal, $.dop1_namespace_literal, $.dfn_namespace_literal],
    [$.dop2_namespace_literal, $.dop1_namespace_literal],
    [$.dop1_namespace_literal, $.dfn_namespace_literal, $.namespace_literal],
    [$.dop1_namespace_literal, $.dfn_namespace_literal],
    [$.dfn_namespace_literal, $.namespace_literal],
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
    [$._expression, $.__identifier],
    [$._expression],
    [$._dfn_expression],
    [$._dop1_expression],
    [$.tradop2, $.tradop1, $.tradfn, $._expression, $.__identifier],
    [$.tradop2, $.tradop1, $.tradfn],
    [$.tradop2, $.tradop1, $._body],
    [$.tradop2, $.tradop1],
    [$.tradfn, $._expression, $.__identifier],
    [$.tradfn],
    [$._body],
    [$._loop_body],
    [$.select_block],
    [$.trap_block],
    [$._loop_select_block],
    [$._loop_trap_block],
    [$._until],
    [$.tradfn],
    [$.tradop1],
    [$.tradop2],
  ],

  rules: {
    // a source_file is the whole code,
    // it might be a file or a code fragment
    source_file: $ => optional(choice(
      $.trad,
      separated(choice(
        alias($._expression, $.statement),
        $.namespace_script,
        $.class_definition,
        $.interface_definition,
        $._trad,
        $.block,
      )),
      terminator,
    )),

    // TRADITIONAL FUNCTIONS

    // trad definitions
    _trad: $ => seq(del, $.trad, newline, del),
    trad: $ => choice($.tradfn, $.tradop1, $.tradop2),
    tradfn: $ => trad_def($, DFN),
    tradop1: $ => trad_def($, DOP1),
    tradop2: $ => trad_def($, DOP2),

    // statements inside trad-defs
    block: $ => choice(
      ... blocks.map(block => $[block]),
      ... loop_blocks.map(block => $[block]),
    ),
    // bodies (terminator-separated lists of statements)
    _body: $ => body($, false),
    // inside loops, there can be additional control words,
    // or blocks including those control words
    _loop_body: $ => body($, true),

    // control words
    control: $ => choice(... control.map(word => $[word])),

    // control structures (blocks)
    ...block_rules(),
    // stinking loops!
    while_block: $ => seq(
      $.while_statement,
      choice(
        repeat(seq(terminator, $.andif_statement)),
        repeat(seq(terminator, $.orif_statement)),
      ),
      optional(seq(terminator, $._loop_body)),
      choice(
        $._until,
        seq(
          terminator, $.endwhile_statement,
        ),
      ),
    ),
    repeat_block: $ => seq(
      $.repeat_statement,
      optional(seq(terminator, $._loop_body)),
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
      optional(seq(terminator, $._loop_body)),
      terminator, $.endfor_statement,
    ),

    // control statements
    branch_statement: $ => seq($.right_arrow, alias($._expression, $.branch_expression)),
    goto_statement: $ => expression_statement($, 'goto'),
    if_statement: $ => condition_statement($, 'if'),
    andif_statement: $ => condition_statement($, 'andif'),
    orif_statement: $ => condition_statement($, 'orif'),
    elseif_statement: $ => condition_statement($, 'elseif'),
    else_statement: $ => $.else,
    endif_statement: $ => choice($.endif, $.end),
    select_statement: $ => expression_statement($, 'select'),
    case_statement: $ => expression_statement($, 'case'),
    caselist_statement: $ => expression_statement($, 'caselist'),
    endselect_statement: $ => choice($.endselect, $.end),
    trap_statement: $ => expression_statement($, 'trap'),
    endtrap_statement: $ => choice($.endtrap, $.end),
    hold_statement: $ => expression_statement($, 'hold'),
    endhold_statement: $ => choice($.endhold, $.end),
    section_statement: $ => seq($.section, $.identifier),
    endsection_statement: $ => choice($.endsection, $.end),
    with_statement: $ => expression_statement($, 'with'),
    endwith_statement: $ => choice($.endwith, $.end),
    disposable_statement: $ => expression_statement($, 'disposable'),
    enddisposable_statement: $ => choice($.enddisposable, $.end),
    while_statement: $ => condition_statement($, 'while'),
    until_statement: $ => condition_statement($, 'until'),
    endwhile_statement: $ => choice($.endwhile, $.end),
    repeat_statement: $ => $.repeat,
    for_statement: $ => seq(
      $.for,
      alias(repeat1($._identifier), $.for_var_names),
      choice($.in, $.ineach),
      alias($._expression, $.for_array_expression),
    ),
    endfor_statement: $ => choice($.endfor, $.end),
    continue_statement: $ => $.continue,
    leave_statement: $ => $.leave,
    return_statement: $ => $.return,

    // NAMESPACES AND OBJECT ORIENTED PROGRAMMING

    // namespace scripts can include statements, but
    // no blocks or control flow words (neither labels)
    namespace_script: $ => seq(
      $.namespace_statement,
      repeat(seq(terminator, choice(
        alias($._expression, $.statement),
        $._trad,
        $.namespace_script,
        $.class_definition,
      ))),
      terminator, $.endnamespace_statement,
    ),
    namespace_statement: $ => seq($.namespace, $.identifier),
    endnamespace_statement: $ => choice($.endnamespace, $.end),

    class_definition: $ => seq(
      $.class_statement,
      repeat(seq(terminator, choice(
        alias($._expression, $.statement),
        $._trad,
        $.namespace_script,
        $.class_definition,
        $.interface_definition,
        $.property_section,
        $.access_statement,
        $.attribute_statement,
        $.include_statement,
        $.using_statement,
        $.field_statement,
      ))),
      terminator, $.endclass_statement,
    ),
    property_section: $ => seq(
      $.property_statement,
      optional(seq(terminator, $.access_statement)),
      // (!) allow any tradfn, not only get/set/shape methods
      repeat1(seq(terminator, del, $.tradfn, terminator, del)),
      terminator, $.endproperty_statement,
    ),
    class_statement: $ => seq(
      $.class,
      $.identifier,
      optional(seq(colon, choice($._identifier, $.string_literal))),
      repeat(seq(',', choice($._identifier, $.string_literal))),
    ),
    endclass_statement: $ => choice($.endclass, $.end),
    field_statement: $ => seq(
      $.field,
      optional($.visibility),
      optional($.sharing),
      optional($.readonly),
      optional($.type),
      choice(
        $.identifier,
        alias($._field_assignment, $.assignment)),
    ),
    include_statement: $ => seq($.include, $._identifier),
    using_statement: $ => seq(
      $.using,
      choice(
        $._identifier,
        seq(optional($._identifier), ',', optional($.assembly)),
      ),
    ),
    // like assignment, but left side must be an identifier
    _field_assignment: $ => seq(
      alias($._field_assign_left, $.assign_left),
      $.left_arrow,
      alias($._expression, $.assign_right),
    ),
    _field_assign_left: $ => $.identifier,
    assembly: _ => /.*/,
    property_statement: $ => seq(
      $.property,
      optional(choice($.simple, $.keyed, $.numbered)),
      optional($.default),
      $.identifier,
      repeat(seq(',', $._identifier)),
    ),
    endproperty_statement: $ => choice($.endproperty, $.end),
    require_statement: $ => seq($.require, $.path),
    path: _ => /.*/,
    attribute_statement: $ => seq(
      $.attribute,
      $.identifier,
      optional(alias($._expression, $.constructor_args)),
    ),
    signature_statement: $ => seq(
      $.signature,
      /.*/, // TODO
    ),
    implements_statement: $ => seq(
      $.implements,
      choice(
        seq($.constructor, optional(seq($.base, $._expression))),
        $.destructor,
        seq($.method, $._identifier),
        seq($.trigger, choice(
          seq($._identifier, repeat(seq(',', $._identifier))),
          '*',
        )),
      ),
    ),
    base: $ => seq(colon, $._identifier),
    access_statement: $ => seq(
      $.access,
      choice(
        seq($.visibility, optional($.sharing)),
        $.sharing,
        $.webmethod,
      ),
      optional($.override),
      optional($.overridable),
    ),
    // other elements of class-related statements
    visibility: _ => choice(/private/i, /public/i),
    sharing: _ => choice(/instance/i, /shared/i),
    readonly: _ => /readonly/i,
    type: _ => /type/i,
    simple: _ => /simple/i,
    numbered: _ => /numbered/i,
    keyed: _ => /keyed/i,
    default: _ => /default/i,
    constructor: _ => /constructor/i,
    destructor: _ => /destructor/i,
    method: _ => /method/i,
    trigger: _ => /trigger/i,
    webmethod: _ => /webmethod/i,
    override: _ => /override/i,
    overridable: _ => /overridable/i,

    interface_definition: $ => seq(
      $.interface_statement,
      repeat(seq(newline, choice(
        $.interface_method,
        $.interface_property,
      ))),
      newline, $.endinterface_statement,
    ),
    // interface methods are tradfns without bodies
    interface_method: $ => seq(del, trad_header($, DFN), newline, del),
    interface_property: $ => seq(
      $.property_statement,
      repeat1(seq(terminator, alias($.interface_method, $.property_method))),
      newline, $.endproperty_statement,
    ),
    interface_statement: $ => seq($.interface, $.identifier),
    endinterface_statement: $ => choice($.endinterface, $.end),

    // APL

    // an _expression is any non-dfn/dop valid expression
    _expression: $ => choice(
      expression($, 0,
        $.definition,
        ...literals.map(l => $[l + '_literal']),
        $.system_command,
        $.primitive,
        $._identifier,
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
    _identifier: $ => choice(
      $.__identifier,
      alias($._dot_identifier, $.identifier),
    ),
    _dot_identifier: $ => seq($.__identifier, repeat1(seq('.', $.__identifier))),
    __identifier: $ => alias(choice($.identifier, '#', '##'), $.identifier),
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

// build names list, with dXX prefixes
// 'name' will give ['name', 'dfn_name', ...]
// '_name' will give ['_name', '_dfn_name', ...]
function defs(name) {
  const prefixes = ['', 'dfn_', 'dop1_', 'dop2_'];
  const private = name[0] == '_' ? '_' : '';
  const base = name[0] == '_' ? name.substring(1) : name;
  return prefixes.map((prefix) => [private + prefix + base]);
}

// return naked and definition nodes for given name
function _defs($$, name) {
  const d = defs(name);
  return d.map((di) => $$[di]);
}

// return naked and definition aliases for given name of
// each corresponding _expression (eg: $.dfn_expression
// is aliased as $.name_expression)
function _alias($$, name){
  const expressions = _defs($$, '_expression');
  const aliases = _defs($$, name);
  return expressions.map((ei, i) => alias(ei, aliases[i]));
}

// for given choices, return "scan" of choice
function _choice(choices){
  const c0 = choices[0];
  const c1 = choice(choices[1], c0);
  const c2 = choice(choices[2], c1);
  const c3 = choice(choices[3], c2);
  return [c0, c1, c2, c3];
}

// return expression for given definition d (0 for naked)
// and possible extra elements (an expression might be
// composed of other expressions, if those subexpressions
// contain identifiers of dfn, dop1 or dop2, the expression
// will be a dfn, dop1 or dop2)
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

// statements followed by simple expressions
function expression_statement($$, statement){
  return seq($$[statement], alias($$._expression, $$[statement+'_expression']));
}

// for a list of statements for different definitions,
// a separator and a definition d (0 for naked), return
// a list of statements separated by separator including
// any statements up to d. If d < 0, statements should
// contain only the naked statements (d == 0)
function separated(statements, separator=terminator, d=-1){
  if (d == 0) statements = statements[0];
  if (d <= 0) return seq(
    optional(separator),
    statements,
    repeat(seq(separator, statements)),
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

// return terminator-separed list of statements including at least one
// identifier for given definition d
function statements($$, d){
  return separated(_alias($$, 'statement'), terminator, d);
}

// return terminator-separed list of _statements including at least one
// identifier for given definition d
function _statements($$, d){
  return separated(_defs($$, '_statement'), terminator, d);
}

// return sequence where at least one of the left or right elements
// include an identifier for given definition d
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

// create rules for all blocks inside trad-defs, taking into
// account that loop blocks can contain additional statements,
// as well as other blocks inside loop blocks
function block_rules(){
  function block(name){
    return ($, body) => seq(
      label($, $[name + '_statement']),
      optional(seq(terminator, body)),
      terminator, label($, $['end' + name + '_statement']),
    );
  }
  const rules = {
    if_block: ($, body) => seq(
      label($, $.if_statement),
      repeat(seq(
        choice(
          repeat(seq(terminator, label($, $.andif_statement))),
          repeat(seq(terminator, label($, $.orif_statement))),
        ),
        optional(seq(terminator, body)),
        terminator, label($, $.elseif_statement),
      )),
      choice(
        repeat(seq(terminator, label($, $.andif_statement))),
        repeat(seq(terminator, label($, $.orif_statement))),
      ),
      optional(seq(
        optional(seq(terminator, body)),
        terminator, label($, $.else_statement),
      )),
      optional(seq(terminator, body)),
      terminator, label($, $.endif_statement),
    ),
    select_block: ($, body) => prec.right(seq(
      label($, $.select_statement),
      repeat(seq(
        terminator, choice(
          label($, $.case_statement),
          label($, $.caselist_statement),
        ),
        optional(seq(terminator, body)),
      )),
      optional(seq(
        terminator, choice(
          label($, $.case_statement),
          label($, $.caselist_statement),
          label($, $.else_statement),
        ),
        optional(seq(terminator, body)),
      )),
      terminator, label($, $.endselect_statement),
    )),
    trap_block: ($, body) => prec.right(seq(
      label($, $.trap_statement),
      optional(seq(terminator, body)),
      repeat(seq(
        terminator, choice(
          label($, $.case_statement),
          label($, $.caselist_statement),
        ),
        optional(seq(terminator, body)),
      )),
      optional(seq(
        terminator, choice(
          label($, $.case_statement),
          label($, $.caselist_statement),
          label($, $.else_statement),
        ),
        optional(seq(terminator, body)),
      )),
      terminator, label($, $.endtrap_statement),
    )),
    hold_block: block('hold'),
    section_block: block('section'),
    with_block: block('with'),
    disposable_block: block('disposable'),
  }
  const keys = Object.keys(rules);
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i];
    let fn = rules[k];
    rules[k] = $ => fn($, $._body);
    rules['_loop_' + k] = $ => fn($, $._loop_body);
  }
  return rules;
}

// conditions in conditional blocks
function condition_statement($$, name) {
  return seq(
    $$[name],
    alias($$._expression, $$[name + '_condition']),
  );
}

// bodies of blocks
function body($$, loop) {
  return separated(choice(
    alias(label($$, $$._expression), $$.statement),
    ... body_statements.map(statement => $$[statement]),
    ... body_target_statements.map(statement => label($$, $$[statement])),
    ... loop ? body_loop_statements.map(statement => label($$, $$[statement])) : [],
    ... blocks.map(block => loop ? alias($$['_loop_' + block], $$[block]) : $$[block]),
    ... loop_blocks.map(block => $$[block]),
  ));
}

// inside trad-defs, a statement might be preceded by a label
function label($$, statement){
    return choice(
      statement,
      seq(
        alias($$.identifier, $$.label),
        colon,
        statement,
      ),
    );
}

// trad-fns and trad-ops definitons
function trad_def($$, d) {
  return seq(
    trad_header($$, d),
    repeat(seq(repeat1(';'), field('local', $$.identifier))),
    repeat(';'),
    newline,
    optional(field('body', $$._body)),
  );
}

// trad-fns and trad-ops headers
function trad_header($$, d) {
  var center = [field('name', $$.identifier)];
  if (d > DFN) {
    center.splice(0, 0, '(', field('left_op', $$.identifier));
    if (d == DOP2) {
      center.push(field('right_op', $$.identifier));
    }
    center.push(')');
  }
  const left_arg = choice(
    $$.identifier,
    seq('(', repeat1($$.identifier), ')'),
    seq('{', $$.identifier, '}'),
  );
  const right_arg = choice(
    $$.identifier,
    seq('(', repeat1($$.identifier), ')'),
  );
  return seq(
    optional(field('result', seq(
      choice(
        $$.identifier,
        seq('(', repeat1($$.identifier), ')'),
        seq('{', $$.identifier, '}'),
      ),
      $$.left_arrow,
    ))),
    choice(
      ...center,
      seq(
        optional(field('left_arg', left_arg)),
        ...center,
        field('right_arg', right_arg),
      ),
    ),
  );
}

// rules for dfns and dops
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
    // a namespace_literal includes members separated by terminators, or could be empty
    namespace_literal($$, d) {
      const members = separated(_defs($$, 'member'), terminator, d);
      if (d == 0) return seq('(', optional(choice(
        members,
        terminator,
      )), ')');
      return seq('(', members, ')');
    },
    // namespace members can be definition expressions
    member($$, d) {
      const members = _alias($$, 'member_expression');
      const name = field('member_name', $$._identifier);
      return seq(name, colon, members[d]);
    },
    // a parenthesis might be a parenthesized expression
    // or an APLAN vector definition (if there are separators)
    parenthesis($$, d) {
      return seq('(', statements($$, d), ')')
    },
    // indices might be separated by separators (;) or not
    indices($$, d) {
      const indices = separated(_alias($$, 'index'), separator, d);
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
