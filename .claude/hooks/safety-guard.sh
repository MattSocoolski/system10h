#!/bin/bash
# SAFETY GUARD — chroni dane/ i automatyzacje/ przed destrukcyjnymi komendami
# Hook: PreToolUse (Bash)
# Input: JSON na stdin z tool_input.command
# Exit 0 = OK, Exit 2 = BLOKADA (stdout = powód)

# Czytaj JSON ze stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)

# Jeśli nie udało się sparsować — przepuść
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Destrukcyjne wzorce na chronionych ścieżkach
# rm -rf / rm -r / rm na dane/ automatyzacje/ .env CLAUDE.md
if echo "$COMMAND" | grep -qE '(rm\s+(-[rRf]+\s+)*(dane/|automatyzacje/|\.env|CLAUDE\.md))'; then
  echo "BLOKADA: Próba usunięcia chronionego pliku/folderu."
  echo "Komenda: $COMMAND"
  echo "Chronione: dane/, automatyzacje/, .env, CLAUDE.md"
  exit 2
fi

# git reset --hard / git checkout -- na chronionych
if echo "$COMMAND" | grep -qE '(git\s+reset\s+--hard|git\s+checkout\s+--\s+(dane/|automatyzacje/|\.env|CLAUDE\.md))'; then
  echo "BLOKADA: Destrukcyjna komenda git na chronionym pliku."
  echo "Komenda: $COMMAND"
  exit 2
fi

# Nadpisanie przez redirect > na chronionych
if echo "$COMMAND" | grep -qE '>\s*(dane/|automatyzacje/|\.env|CLAUDE\.md)'; then
  echo "BLOKADA: Próba nadpisania chronionego pliku przez redirect."
  echo "Komenda: $COMMAND"
  exit 2
fi

# Wszystko inne — przepuść
exit 0
