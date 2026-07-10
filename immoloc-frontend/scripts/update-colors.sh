#!/bin/bash
# Script pour mettre à jour les couleurs vers le design system ImmoLoc

# Répertoires à traiter
DIRS=(
  "features/dashboard/components/owner"
  "features/home/components"
  "components"
)

for DIR in "${DIRS[@]}"; do
  echo "🎨 Mise à jour des couleurs dans $DIR..."

  find "/Users/apple/Private things/skyyti/immoloc-frontend/$DIR" -name "*.tsx" -type f -exec sed -i '' \
    -e 's/bg-white\([^-]\)/bg-background-card\1/g' \
    -e 's/text-neutral-900\([^-]\)/text-foreground\1/g' \
    -e 's/text-neutral-500\([^-]\)/text-foreground-muted\1/g' \
    -e 's/text-neutral-400\([^-]\)/text-foreground-muted\1/g' \
    -e 's/border-neutral-200\/80/border-border\/80/g' \
    -e 's/border-neutral-200\([^-\/]\)/border-border\1/g' \
    -e 's/border-neutral-300\([^-]\)/border-border-hover\1/g' \
    -e 's/shadow-neutral-200/shadow-md/g' \
    -e 's/hover:shadow-xl hover:shadow-neutral-200\/40/hover:shadow-lg/g' \
    {} \;
done

echo "✅ Couleurs mises à jour !"
