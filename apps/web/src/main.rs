use actix_web::{App, HttpResponse, HttpServer, get, middleware::Logger, web};
use log::info;

pub mod user;
#[cfg(not(debug_assertions))]
static STATIC_DIR: Dir = include_dir!("apps/web/dist");

#[get("/")]
async fn api_index() -> HttpResponse {
    HttpResponse::Ok().body("Hello from MCSL Future Web API!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    info!("Starting MCSL Future Web server...");

    HttpServer::new(|| {
        let mut app = App::new().wrap(Logger::default());

        app = app.service(web::scope("/api").service(api_index));

        #[cfg(not(debug_assertions))]
        {
            app = app.service(web::scope("").service(
                web::resource(["", "/{path:.*}"]).route(web::get().to(serve_static_files)),
            ));
        }

        app
    })
    .bind("0.0.0.0:11452")?
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

    if let Some(file) = STATIC_DIR.get_file(path) {
        let content = file.contents();
        let mime_type = mime_guess::from_path(path).first_or_octet_stream();
        HttpResponse::Ok()
            .content_type(mime_type.as_ref())
            .body(content)
    } else {
        // Vue Router的History模式路由，返回index.html
        if let Some(index_file) = STATIC_DIR.get_file("index.html") {
            HttpResponse::Ok()
                .content_type("text/html")
                .body(index_file.contents())
        } else {
            HttpResponse::NotFound().into()
        }
    }
}
