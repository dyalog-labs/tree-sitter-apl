(system_command) @keyword

(comment) @comment

; Identifiers

(identifier) @variable

(dfn_identifier) @variable.builtin
[
  (dop_identifier)
  (dop1_identifier)
  (dop2_identifier)
] @variable.parameter.builtin


; Literals

(string_literal) @string
(number_literal) @number

; Operators

[
  (primitive)
  (assign)
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
