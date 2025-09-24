#include <tree_sitter/parser.h>
#include <wctype.h>
#include <string.h>

enum TokenType {
  LEFT_ARG,
  RIGHT_ARG,
  LEFT_OP,
  RIGHT_OP,
  SELF_FN,
  SELF_OP,
  EVAL_IO,
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
int isidentifier0(const int32_t c) {
  return
    L'A' <= c && c <= L'Z' ||
    L'a' <= c && c <= L'z' ||
    L'Ⓐ' <= c && c <= L'Ⓩ' ||
    c == L'_' || c == L'∆' || c == L'⍙';
}

// valid following characters of an identifier
int isidentifier1(const int32_t c) {
  return isidentifier0(c) || iswdigit(c);
}

void *tree_sitter_apl_external_scanner_create() { return NULL; }
void tree_sitter_apl_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_apl_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_apl_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

// The main scanning function
bool tree_sitter_apl_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[INVALID_SYSTEM_COMMAND]) {
    return false;
  }

  // Skip any leading whitespace
  while (iswspace(lexer->lookahead) && !lexer->eof(lexer)) {
    if (lexer->lookahead == '\r' || lexer->lookahead =='\n') {
      return false;
    }
    lexer->advance(lexer, true);
  }
  if (lexer->eof(lexer)) {
    return false;
  }

  // We are interested in tokens that start with ⎕ or {,⍺,⍵,∇,}
  switch (lexer->lookahead) {
  case ALPHA:
      lexer->result_symbol = LEFT_ARG;
      break;
  case OMEGA:
      lexer->result_symbol = RIGHT_ARG;
      break;
  case DEL:
      lexer->result_symbol = SELF_FN;
      break;
  case QUAD:
      lexer->result_symbol = EVAL_IO;
      break;
  default:
    return false;
  }
  lexer->advance(lexer, false); // Consume the character

  switch (lexer->result_symbol) {
  case LEFT_ARG:
    if (lexer->lookahead == ALPHA) {
      lexer->result_symbol = LEFT_OP;
      lexer->advance(lexer, false); // consume another alpha
    }
    return true;  
  case RIGHT_ARG:
    if (lexer->lookahead == OMEGA) {
      lexer->result_symbol = RIGHT_OP;
      lexer->advance(lexer, false); // consume another omega
    }
    return true;  
  case SELF_FN:
    if (lexer->lookahead == DEL) {
      lexer->result_symbol = SELF_OP;
      lexer->advance(lexer, false); // consume another del
    }
    return true;
  case EVAL_IO:
    // If what comes after ⎕ is not a valid character,
    // let the internal lexer handle it by returning false
    if (!isidentifier0(lexer->lookahead)) {
      return true;
    }

    // It's a command-like token. Read the rest of the name
    // TODO: remove 32 chars limit
    char command_name[32];
    int i = 0;
    while (isidentifier1(lexer->lookahead) && !lexer->eof(lexer) && i < 31) {
      command_name[i++] = toupper(lexer->lookahead);
      lexer->advance(lexer, false);
    }
    command_name[i] = '\0';

    // Check if the command is in the list of system commands
    int n = sizeof(SYSTEM_COMMANDS) / sizeof(SYSTEM_COMMANDS[0]);
    for (i = 0; i < n; i++) {
      if (strcmp(command_name, SYSTEM_COMMANDS[i]) == 0) {
        // It's a valid command!
        lexer->result_symbol = SYSTEM_COMMAND;
        return true;
      }
    }

    // The command was not in the list
    lexer->result_symbol = INVALID_SYSTEM_COMMAND;
    return true;
  }
}