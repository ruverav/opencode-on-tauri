use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

const DEFAULT_WIDTH: f64 = 1440.0;
const DEFAULT_HEIGHT: f64 = 900.0;
const SAVE_DEBOUNCE: Duration = Duration::from_millis(250);

#[derive(Serialize, Deserialize)]
struct WindowState {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

#[derive(Default)]
struct WindowStateCache {
    pending: Option<WindowState>,
    last_saved_at: Option<Instant>,
}

fn server_url() -> String {
    let host = env::var("OPENCODE_HOST").unwrap_or_else(|_| "127.0.0.1".into());
    let port = env::var("OPENCODE_PORT").unwrap_or_else(|_| "4096".into());
    format!("http://{}:{}", host, port)
}

fn state_json_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("window_state.json")
}

fn load_window_state<R: tauri::Runtime, M: Manager<R>>(app: &M) -> Option<WindowState> {
    let dir = app.path().app_data_dir().ok()?;
    let path = state_json_path(&dir);
    let json = fs::read_to_string(path).ok()?;
    serde_json::from_str(&json).ok()
}

fn save_window_state<R: tauri::Runtime, M: Manager<R>>(app: &M, state: &WindowState) {
    if let Ok(dir) = app.path().app_data_dir() {
        let _ = fs::create_dir_all(&dir);
        let path = state_json_path(&dir);
        if let Ok(json) = serde_json::to_string(state) {
            let _ = fs::write(path, json);
        }
    }
}

fn current_window_state<R: tauri::Runtime>(window: &tauri::Window<R>) -> Option<WindowState> {
    let (Ok(pos), Ok(size)) = (window.outer_position(), window.outer_size()) else {
        return None;
    };
    let scale = window.scale_factor().ok()?;
    let lp = pos.to_logical::<f64>(scale);
    let ls = size.to_logical::<f64>(scale);
    Some(WindowState {
        x: lp.x,
        y: lp.y,
        width: ls.width,
        height: ls.height,
    })
}

fn flush_window_state<R: tauri::Runtime>(window: &tauri::Window<R>, force: bool) {
    let cache = window.state::<Mutex<WindowStateCache>>();
    let mut cache = cache.lock().expect("window state cache poisoned");
    cache.pending = current_window_state(window);

    let now = Instant::now();
    let should_flush = force
        || cache
            .last_saved_at
            .map(|last| now.duration_since(last) >= SAVE_DEBOUNCE)
            .unwrap_or(true);

    if should_flush {
        if let Some(state) = cache.pending.as_ref() {
            save_window_state(window.app_handle(), state);
            cache.last_saved_at = Some(now);
        }
    }
}

fn can_restore_window_state(app: &tauri::App<tauri::Wry>, state: &WindowState) -> bool {
    if state.width <= 0.0 || state.height <= 0.0 {
        return false;
    }

    let center_x = state.x + (state.width / 2.0);
    let center_y = state.y + (state.height / 2.0);
    app.monitor_from_point(center_x, center_y)
        .ok()
        .flatten()
        .is_some()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let url = server_url();
    tauri::Builder::default()
        .on_window_event(|window, event| {
            match event {
                WindowEvent::Moved(_) | WindowEvent::Resized(_) => flush_window_state(window, false),
                WindowEvent::CloseRequested { .. } => flush_window_state(window, true),
                _ => {}
            }
        })
        .setup(move |app| {
            app.manage(Mutex::new(WindowStateCache::default()));

            let window_builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url.parse().expect("Invalid OPENCODE_HOST/OPENCODE_PORT")),
            )
            .title("")
            .resizable(true)
            .decorations(false)
            .initialization_script(include_str!("../inject.js"))
            .on_page_load(|window, payload| {
                if payload.event() == tauri::webview::PageLoadEvent::Finished {
                    let _ = window.eval(include_str!("../inject.js"));
                }
            });

            let _main = if let Some(state) = load_window_state(app).filter(|state| can_restore_window_state(app, state)) {
                window_builder
                    .inner_size(state.width, state.height)
                    .position(state.x, state.y)
                    .build()?
            } else {
                window_builder
                    .inner_size(DEFAULT_WIDTH, DEFAULT_HEIGHT)
                    .center()
                    .build()?
            };

            #[cfg(target_os = "windows")]
            let _ = _main.set_effects(
                tauri::window::EffectsBuilder::new()
                    .effect(tauri::window::Effect::Mica)
                    .build(),
            );

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, _event| {})
}
