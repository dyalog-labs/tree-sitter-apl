#include <tree_sitter/parser.h>
#include <wctype.h>
#include <string.h>
#include <ctype.h>

enum TokenType {
  LEFT_OP,
  RIGHT_OP,
  SELF_OP,
  SYSTEM_COMMAND,
  INVALID_SYSTEM_COMMAND,
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

void *tree_sitter_apl_external_scanner_create() { return NULL; }
void tree_sitter_apl_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_apl_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_apl_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

// main scanning function
bool tree_sitter_apl_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  // in error recovery mode
  if (valid_symbols[INVALID_SYSTEM_COMMAND]) {
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
  switch (lexer->lookahead) {
  case ALPHA:
    return two(ALPHA, LEFT_OP, lexer);
  case OMEGA:
    return two(OMEGA, RIGHT_OP, lexer);
  case DEL:
    return two(DEL, SELF_OP, lexer);
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

  // it's a command-like token; read the rest of the name
  // TODO: remove 32 chars limit
  char command_name[32];
  int i = 0;
  while (isidentifier1(lexer->lookahead) && !lexer->eof(lexer) && i < 31) {
    command_name[i++] = toupper(lexer->lookahead);
    lexer->advance(lexer, false);
  }
  command_name[i] = '\0';

  // check if the command is in the list of system commands
  int n = sizeof(SYSTEM_COMMANDS) / sizeof(SYSTEM_COMMANDS[0]);
  for (i = 0; i < n; i++) {
    if (strcmp(command_name, SYSTEM_COMMANDS[i]) == 0) {
      // it's a valid command
      lexer->result_symbol = SYSTEM_COMMAND;
      return true;
    }
  }

  // the command was not in the list
  lexer->result_symbol = INVALID_SYSTEM_COMMAND;
  return true;
}
