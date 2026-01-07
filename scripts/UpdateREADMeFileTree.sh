#!/bin/bash
# Safely update the "## 📁 Project Architecture" section in a Markdown file.

README_FILE=${1:-README.md}
BACKUP_FILE="${README_FILE}.bak"

# Check if file exists
if [ ! -f "$README_FILE" ]; then
    echo "❌ Error: $README_FILE not found!"
    exit 1
fi

# Check if 'tree' exists
if ! command -v tree >/dev/null 2>&1; then
    echo "❌ Error: 'tree' command not found. Install with: sudo apt install tree"
    exit 1
fi

# Make a backup
cp "$README_FILE" "$BACKUP_FILE"
echo "🗂️  Backup created: $BACKUP_FILE"

# Generate the directory tree
TREE_OUTPUT=$(tree -I "node_modules|venv|test|__pycache__" -L 9)

# Use awk to replace the section
awk -v tree="$TREE_OUTPUT" '
BEGIN { in_section=0 }
/^## 📁 Project Architecture/ {
    print "## 📁 Project Architecture"
    print ""
    print "```"
    print tree
    print "```"
    in_section=1
    next
}
in_section && /^## / { in_section=0 }
!in_section
' "$README_FILE" > "${README_FILE}.tmp" && mv "${README_FILE}.tmp" "$README_FILE"

echo "✅ Successfully updated ## 📁 Project Architecture in $README_FILE"
