[
  (goto)
  (if)
  (elseif)
  (else)
  (endif)
  (andif)
  (orif)
  (while)
  (until)
  (endwhile)
  (end)
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

(trad name: (identifier) @function)
(trad left_arg: (identifier) @variable.builtin)
(trad right_arg: (identifier) @variable.builtin)
(trad left_op: (identifier) @variable.parameter.builtin)
(trad right_op: (identifier) @variable.parameter.builtin)
(trad local: (identifier) @variable.builtin)

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
