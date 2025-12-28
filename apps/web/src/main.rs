mod api;
mod config;
mod user;
mod utils;

use actix_web::{middleware::Logger, web, App, HttpServer};
#[cfg(not(debug_assertions))]
use include_dir::{include_dir, Dir};
use log::{error, info};
use std::fs;
use std::path::Path;

#[cfg(not(debug_assertions))]
static STATIC_DIR: Dir = include_dir!("apps/web/dist");

pub const MAIN_DIR_NAME: &str = "mcsl-web";

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let main_dir = Path::new(MAIN_DIR_NAME);

    if !main_dir.exists() {
        fs::create_dir_all(&main_dir).map_err(|e| {
            error!(
                "Failed to create main directory at '{}': {}",
                main_dir.display(),
                e
            );
            e
        })?;
        info!("Created main directory");
    }

    config::ensure_config(&main_dir)?;
    user::load_users(&main_dir)?;

    let config = config::load_config(&main_dir)?;

    let bind_addr = format!("{}:{}", config.host, config.port);

    HttpServer::new(move || {
        let mut app = App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(config.clone()));

        app = app.service(
            web::scope("/api")
                .service(api::api_index)
                .service(api::api_user_login)
                .service(api::api_user_refresh)
                .service(api::api_user_create)
                .service(api::api_user_register)
                .service(api::api_user_update)
                .service(api::api_user_update_password)
                .service(api::api_user_delete)
                .service(api::api_user_get_self),
        );

        #[cfg(not(debug_assertions))]
        {
            app = app.service(web::scope("").service(
                web::resource(["", "/{path:.*}"]).route(web::get().to(serve_static_files)),
            ));
        }

        app
    })
    .bind(&bind_addr)
    .map_err(|e| {
        error!("Failed to bind server to {}: {}", &bind_addr, e);
        e
    })?
    .run()
    .await
}

#[cfg(not(debug_assertions))]
async fn serve_static_files(path: web::Path<String>) -> HttpResponse {
    let path = path.into_inner();
    let path = if path.is_empty() || path == "/" {
        "index.html"
    } else {
        &path
    };

    match STATIC_DIR.get_file(path) {
        Some(file) => {
            let content = file.contents();
            let mime_type = mime_guess::from_path(path).first_or_octet_stream();
            HttpResponse::Ok()
                .content_type(mime_type.as_ref())
                .body(content)
        }
        None => {
            // Vue Router的History模式路由，返回index.html
            match STATIC_DIR.get_file("index.html") {
                Some(index_file) => HttpResponse::Ok()
                    .content_type("text/html")
                    .body(index_file.contents()),
                None => {
                    error!(
                        "Static file '{}' not found and index.html not available",
                        path
                    );
                    HttpResponse::NotFound().into()
                }
            }
        }
    }
}
