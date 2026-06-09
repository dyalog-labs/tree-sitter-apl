[
  (goto)
  (if)
  (elseif)
  (else)
  (endif)
  (andif)
  (select)
  (case)
  (caselist)
  (endselect)
  (trap)
  (endtrap)
  (hold)
  (endhold)
  (section)
  (endsection)
  (with)
  (endwith)
  (disposable)
  (enddisposable)
  (orif)
  (while)
  (until)
  (endwhile)
  (for)
  (in)
  (ineach)
  (endfor)
  (end)
  (namespace)
  (endnamespace)
  (class)
  (endclass)
  (interface)
  (endinterface)
  (continue)
  (leave)
  (return)
  (namespace)
  (endnamespace)
  (class)
  (endclass)
  (field)
  (include)
  (using)
  (interface)
  (endinterface)
  (property)
  (endproperty)
  (require)
  (attribute)
  (signature)
  (implements)
  (access)
  (system_command)
] @keyword

(comment) @comment

; Identifiers

(identifier) @variable
; the following line works in tree-sitter highlight,
; but not in nvim (#is-not? predicate not supported)
; ((identifier) @variable.builtin (#is-not? local))

(dfn_identifier) @variable.builtin
[
  (dop_identifier)
  (dop1_identifier)
  (dop2_identifier)
] @variable.parameter.builtin

(tradfn name: (identifier) @function)
(tradfn left_arg: (identifier) @variable.builtin)
(tradfn right_arg: (identifier) @variable.builtin)
(tradfn left_op: (identifier) @variable.parameter.builtin)
(tradfn right_op: (identifier) @variable.parameter.builtin)
(tradfn local: (identifier) @variable.builtin)

(tradop1 name: (identifier) @function)
(tradop1 left_arg: (identifier) @variable.builtin)
(tradop1 right_arg: (identifier) @variable.builtin)
(tradop1 left_op: (identifier) @variable.parameter.builtin)
(tradop1 right_op: (identifier) @variable.parameter.builtin)
(tradop1 local: (identifier) @variable.builtin)

(tradop2 name: (identifier) @function)
(tradop2 left_arg: (identifier) @variable.builtin)
(tradop2 right_arg: (identifier) @variable.builtin)
(tradop2 left_op: (identifier) @variable.parameter.builtin)
(tradop2 right_op: (identifier) @variable.parameter.builtin)
(tradop2 local: (identifier) @variable.builtin)

; Literals

(string_literal) @string
(number_literal) @number

; Operators

[
  (primitive)
  (left_arrow)
  (right_arrow)
] @operator

[
  "⋄"
  ";"
  ":"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket
