# Opencode on Tauri

A lightweight Tauri v2 desktop shell for [Opencode](https://opencode.ai). Unlike the official Electron desktop (which bundles the frontend and ships as pre-built installers), this one loads the Opencode SPA from a local backend server. It also supports native ARM64 compilation for Windows and can connect to an Opencode agent running inside WSL2 — something the official desktop cannot do.

> **Note:** This project has been tested on Windows. Linux and macOS may work but are not guaranteed.

## Prerequisites

- **Rust** (edition 2021) — install via [rustup](https://rustup.rs)
- **Node.js** (for `@tauri-apps/cli`)
- **Platform-specific build tools** (see Tauri's [prerequisites guide](https://v2.tauri.app/start/prerequisites/))

### Linux

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### macOS

Xcode Command Line Tools:

```bash
xcode-select --install
```

### Windows

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) (or Visual Studio with "Desktop development with C++" workload)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (included in Windows 10 1803+ and Windows 11)

## Quick Start

```bash
# Install Tauri CLI dependency
npm install

# Run in development mode (requires the Opencode backend at http://127.0.0.1:4096)
npm run dev
```

## Building

There are two ways to build, depending on whether you need a bundled installer or just the binary:

### Binary only (via cargo)

Builds just the executable — no installer bundle, no frontend bundling step.

```powershell
# Windows ARM64 (from within src-tauri/)
cd src-tauri
cargo build --target aarch64-pc-windows-msvc --release
```

The output is at `src-tauri/target/aarch64-pc-windows-msvc/release/opencode-desktop.exe`. This is the minimal build and the fastest option.

### Binary + installer bundle (via tauri build)

`tauri build` (invoked via `npm run build`) first compiles the Rust binary, then runs Tauri's bundler to produce platform installers (MSI on Windows, DMG on macOS, AppImage on Linux). See `tauri.conf.json` → `bundle.targets` to configure which formats to produce.

```bash
# From the project root
npm run build

# Or equivalently:
npx tauri build
```

> Since `tauri.conf.json` currently has `"targets": []` (no bundler targets configured), `tauri build` behaves similarly to `cargo build` and produces only the binary.

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENCODE_HOST` | `127.0.0.1` | Hostname/IP of the Opencode backend server |
| `OPENCODE_PORT` | `4096` | Port of the Opencode backend server |

**PowerShell (Windows):**

```powershell
$env:OPENCODE_HOST = "192.168.1.100"
$env:OPENCODE_PORT = "8080"
npm run dev
```

**Bash (Linux/macOS):**

```bash
OPENCODE_HOST=192.168.1.100 OPENCODE_PORT=8080 npm run dev
```

### Backend URL Resolution

The app constructs the URL as `http://{OPENCODE_HOST}:{OPENCODE_PORT}`. If neither variable is set, it defaults to `http://127.0.0.1:4096`, matching the `devUrl` in `tauri.conf.json`.

### Tauri Remote Capability

Because the desktop shell loads a remote HTTP origin instead of bundled frontend files, `src-tauri/capabilities/default.json` currently allows `http://*:*` so the Tauri window APIs remain available when `OPENCODE_HOST` and `OPENCODE_PORT` change.

For locked-down deployments, narrow this pattern to the exact backend URL you intend to use.

## Platform Targets

Commands below assume `cargo build --release` from within `src-tauri/`. Substitute `npm run build` if you need bundler output.

### Windows (ARM64)

```powershell
# From src-tauri/
cargo build --target aarch64-pc-windows-msvc --release
```

Output: `target/aarch64-pc-windows-msvc/release/opencode-desktop.exe`

### Windows (x86-64)

```powershell
# From src-tauri/
cargo build --target x86_64-pc-windows-msvc --release
```

Output: `target/x86_64-pc-windows-msvc/release/opencode-desktop.exe`

### Linux (x86-64)

```bash
# From src-tauri/
cargo build --release
```

Output: `target/release/opencode-desktop`

### Linux (ARM64)

```bash
rustup target add aarch64-unknown-linux-gnu
cd src-tauri
cargo build --target aarch64-unknown-linux-gnu --release
```

Output: `target/aarch64-unknown-linux-gnu/release/opencode-desktop`

### macOS (x86-64 / Apple Silicon)

```bash
# From src-tauri/
cargo build --release
```

Output: `target/release/opencode-desktop`

## Project Structure

```
opencode-desktop/
├── package.json              # npm scripts: tauri, dev, build
├── dist/                     # Frontend build output (served by Tauri in production)
├── src-tauri/
│   ├── Cargo.toml            # Rust dependencies and metadata
│   ├── tauri.conf.json       # Tauri configuration (build, bundle, security)
│   ├── capabilities/
│   │   └── default.json      # Permission capabilities (window controls)
│   ├── icons/                # Application icons (all platforms + mobile)
│   ├── inject.js             # Injects custom title bar buttons into the webview
│   └── src/
│       ├── lib.rs            # Core app: window creation, state persistence, Mica effect
│       └── main.rs           # Entry point (calls lib::run)
└── README.md
```

## Features

- **Frameless window** (`decorations: false`) with custom injected title bar buttons
- **Window state persistence** — saves and restores position and size across sessions
- **DPI-aware** — saves/restores in logical coordinates, correctly handling display scale factors
- **Debounced window-state writes** — avoids excessive disk writes while resizing or moving
- **Safe restore fallback** — re-centers if the stored window position is no longer on any connected monitor
- **Environment variable configuration** — no hardcoded backend URLs
- **Windows Mica effect** — translucent acrylic background (Windows 11)
- **Frontend-agnostic** — loads any web app from the configured backend URL
- **MutationObserver-based injection** — custom title bar buttons survive SPA DOM navigation

## Capabilities

The app requests minimal Tauri permissions in `capabilities/default.json`:

- `core:default` — Core Tauri APIs
- `core:window:default` — Window management APIs
- `core:window:allow-minimize`
- `core:window:allow-close`
- `core:window:allow-toggle-maximize`

## Acknowledgements

This project was developed collaboratively with AI, using the free **DeepSeek V4 Flash** model via **OpenCode Zen**.

## License

MIT
