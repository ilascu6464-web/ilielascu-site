#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_APP="$PROJECT_DIR/node_modules/electron/dist/Electron.app"
BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/flydbx-build.XXXXXX")"
TARGET_APP="$BUILD_DIR/FlyDBX.app"

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

if [[ ! -d "$ELECTRON_APP" ]]; then
  echo "Electron nu este instalat. Rulează npm install."
  exit 1
fi

ditto "$ELECTRON_APP" "$TARGET_APP"
mv "$TARGET_APP/Contents/MacOS/Electron" "$TARGET_APP/Contents/MacOS/FlyDBX"

plutil -replace CFBundleDisplayName -string "FlyDBX" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleExecutable -string "FlyDBX" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleIdentifier -string "de.ilielascu.flydbx" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleName -string "FlyDBX" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleShortVersionString -string "2.0.0" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleVersion -string "2.0.0" "$TARGET_APP/Contents/Info.plist"
plutil -replace CFBundleIconFile -string "flydbx.icns" "$TARGET_APP/Contents/Info.plist"

for key in \
  NSBluetoothAlwaysUsageDescription \
  NSBluetoothPeripheralUsageDescription \
  NSCameraUsageDescription \
  NSMicrophoneUsageDescription; do
  plutil -remove "$key" "$TARGET_APP/Contents/Info.plist" 2>/dev/null || true
done

rm -f "$TARGET_APP/Contents/Resources/default_app.asar"
rm -rf "$TARGET_APP/Contents/Resources/app"
mkdir -p "$TARGET_APP/Contents/Resources/app"

for file in package.json main.js preload.js renderer.js form.html site-editor.js; do
  cp "$PROJECT_DIR/$file" "$TARGET_APP/Contents/Resources/app/$file"
done
cp "$PROJECT_DIR/flydbx.icns" "$TARGET_APP/Contents/Resources/flydbx.icns"

xattr -cr "$TARGET_APP"
codesign --force --deep --sign - "$TARGET_APP"
codesign --verify --deep --strict "$TARGET_APP"

rm -rf "$PROJECT_DIR/FlyDBX.app"
ditto "$TARGET_APP" "$PROJECT_DIR/FlyDBX.app"

echo "FlyDBX.app construit cu succes."
