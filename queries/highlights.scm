(system_command) @keyword

(comment) @Comment

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

(primitive) @operator

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
