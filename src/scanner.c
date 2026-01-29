#include <tree_sitter/parser.h>
#include <wctype.h>
#include <string.h>

enum TokenType {
  LEFT_OP,
  RIGHT_OP,
  SELF_OP,
  SYSTEM_COMMAND,
  INVALID,
};

#define ALPHA L'⍺'
#define OMEGA L'⍵'
#define DEL L'∇'
#define QUAD L'⎕'

const char *SYSTEM_COMMANDS[] = {
  "A", "AI", "AN", "ARBIN", "ARBOUT", "AT", "ATX", "AV", "AVU", "BASE",
  "C", "CLASS", "CLEAR", "CMD", "CR", "CS", "CSV", "CT", "CY", "D",
  "DCT", "DF", "DIV", "DL", "DM", "DMX", "DQ", "DR", "DT", "ED",
  "EM", "EN", "EX", "EXCEPTION", "EXPORT", "FAPPEND", "FAVAIL", "FCHK", "FCOPY", "FCREATE",
  "FDROP", "FERASE", "FHIST", "FHOLD", "FIX", "FLIB", "FMT", "FNAMES", "FNUMS", "FPROPS",
  "FR", "FRDAC", "FRDCI", "FREAD", "FRENAME", "FREPLACE", "FRESIZE", "FSIZE", "FSTAC", "FSTIE",
  "FTIE", "FUNTIE", "FX", "INSTANCES", "IO", "JSON", "KL", "LC", "LOAD", "LOCK",
  "LX", "MAP", "MKDIR", "ML", "MONITOR", "NA", "NAPPEND", "NC", "NCOPY", "NCREATE",
  "NDELETE", "NERASE", "NEW", "NEXISTS", "NGET", "NINFO", "NL", "NLOCK", "NMOVE", "NNAMES",
  "NNUMS", "NPARTS", "NPUT", "NQ", "NR", "NREAD", "NRENAME", "NREPLACE", "NRESIZE", "NS",
  "NSI", "NSIZE", "NTIE", "NULL", "NUNTIE", "NXLATE", "OFF", "OPT", "OR", "PATH",
  "PFKEY", "PP", "PROFILE", "PW", "R", "REFS", "RL", "RSI", "RTL", "S",
  "SAVE", "SD", "SE", "SH", "SHADOW", "SI", "SIGNAL", "SIZE", "SM", "SR",
  "SRC", "STACK", "STATE", "STOP", "SVC", "SVO", "SVQ", "SVR", "SVS", "TALLOC",
  "TC", "TCNUMS", "TGET", "THIS", "TID", "TKILL", "TNAME", "TNUMS", "TPOOL", "TPUT",
  "TRACE", "TRAP", "TREQ", "TS", "TSYNC", "UCS", "USING", "VFI", "VR", "WA",
  "WC", "WG", "WN", "WS", "WSID", "WX", "XML", "XSI", "XT", "Á"
};
const int N_SYSTEM_COMMANDS = sizeof(SYSTEM_COMMANDS) / sizeof(SYSTEM_COMMANDS[0]);

const char *CONTROL_WORDS[] = {
  "GOTO",
  "IF", "ELSEIF", "ELSE", "ENDIF",
  "WHILE", "ENDWHILE", "REPEAT", "UNTIL",
  "FOR", "IN", "INEACH", "ENDFOR",
  "ANDIF", "ORIF", "END",
  "CONTINUE", "LEAVE", "RETURN",
};
const int N_CONTROL_WORDS = sizeof(CONTROL_WORDS) / sizeof(CONTROL_WORDS[0]);

// valid first character of an identifier
// TODO: https://help.dyalog.com/latest/index.htm#Language/Introduction/Variables/Names.htm
bool isidentifier0(const int32_t c) {
  return
    L'A' <= c && c <= L'Z' ||
    L'a' <= c && c <= L'z' ||
    L'Ⓐ' <= c && c <= L'Ⓩ' ||
    c == L'_' || c == L'∆' || c == L'⍙';
}

// valid following characters of an identifier
bool isidentifier1(const int32_t c) {
  return isidentifier0(c) || iswdigit(c);
}

bool two(const int32_t c, const int32_t r, TSLexer *lexer) {
  lexer->advance(lexer, false); // consume character
  if (lexer->lookahead != c) {
    return false;
  }
  lexer->advance(lexer, false); // consume another character
  lexer->result_symbol = r;
  return true;
}

bool control_valid(const bool *valid_symbols) {
  for (int i = 0; i < N_CONTROL_WORDS; i++) {
    if (valid_symbols[INVALID + i + 1])
      return true;
  }
  return false;
}

void *tree_sitter_apl_external_scanner_create() { return NULL; }
void tree_sitter_apl_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_apl_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_apl_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

// main scanning function
bool tree_sitter_apl_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  // in error recovery mode
  if (valid_symbols[INVALID]) {
    return false;
  }

  // skip leading whitespace except newlines
  while (iswspace(lexer->lookahead) && !lexer->eof(lexer)) {
    if (lexer->lookahead == '\r' || lexer->lookahead =='\n') {
      return false;
    }
    lexer->advance(lexer, true); // consume whitespace character
  }
  if (lexer->eof(lexer)) {
    return false;
  }

  // We are interested in tokens that start with ⍺,⍵,∇,⎕
  bool control = false;
  switch (lexer->lookahead) {
  case ALPHA:
    return two(ALPHA, LEFT_OP, lexer);
  case OMEGA:
    return two(OMEGA, RIGHT_OP, lexer);
  case DEL:
    return two(DEL, SELF_OP, lexer);
  case ':':
    if (!control_valid(valid_symbols))
      return false;
    control = true;
  case QUAD:
    lexer->advance(lexer, false); // consume the character
    break;
  default:
    return false;
  }

  // if what comes after the first one is not a valid character,
  // let the internal lexer handle it by returning false
  if (!isidentifier0(lexer->lookahead)) {
    return false;
  }

  // it's a control-word or command-like token; read the rest of the name
  // TODO: remove 32 chars limit
  char name[32];
  int i = 0;
  while (isidentifier1(lexer->lookahead) && !lexer->eof(lexer) && i < 31) {
    name[i++] = towupper(lexer->lookahead);
    lexer->advance(lexer, false);
  }
  name[i] = '\0';
  lexer->result_symbol = INVALID;

    // check if control word is in the list of control words
  if (control) {
    for (i = 0; i < N_CONTROL_WORDS; i++) {
      if (strcmp(name, CONTROL_WORDS[i]) == 0) {
        // it's a valid command
        lexer->result_symbol += i + 1;
        break;
      }
    }
    return true;
  }

  // check if the command is in the list of system commands
  for (i = 0; i < N_SYSTEM_COMMANDS; i++) {
    if (strcmp(name, SYSTEM_COMMANDS[i]) == 0) {
      // it's a valid command
      lexer->result_symbol = SYSTEM_COMMAND;
      return true;
    }
  }

  // the command was not in the list (INVALID_SYSTEM_COMMAND)
  return true;
}
