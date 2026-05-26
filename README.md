# Opencode on Tauri

A lightweight Tauri v2 desktop shell for [Opencode](https://opencode.ai). Unlike the official Electron desktop (which bundles the frontend and ships as pre-built installers), this one loads the Opencode SPA from a local backend server. It also supports native ARM64 compilation for Windows and can connect to an Opencode agent running inside WSL2 with native Linux paths — the official desktop forces `\\wsl$` path translation with lower performance and compatibility.

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

Compile from within `src-tauri/`:

```powershell
# Windows x86-64
cargo build --release

# Windows ARM64 (e.g. Surface Pro, Snapdragon X)
cargo build --release --target aarch64-pc-windows-msvc

# Linux / macOS
cargo build --release
```

Output is at `target/release/opencode-desktop.exe` (or `target/aarch64-pc-windows-msvc/release/opencode-desktop.exe` for ARM64).

You can also build from the project root with `npm run build` (equivalent to `npx tauri build`), but no installer bundler targets are configured so it produces the same binary.

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
