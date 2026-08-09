use actix_web::{HttpRequest, HttpResponse, Responder, delete, get, post, put, web};
use mcsl_resource_provider::{
    DownloadRequest, ProviderError, ProviderRequest, fetch_download_bytes, fetch_json,
};
use mcsl_web_core::error::{AppError, failed, success};
use mcsl_web_core::service::{ApiRequest, ClientMeta, is_loopback_ip};
use mcsl_web_core::{AppResult, dispatch};
use serde::Serialize;
use serde_json::Value;
use std::net::IpAddr;

#[post("/resource/provider")]
pub async fn api_resource_provider(body: web::Json<ProviderRequest>) -> impl Responder {
    match fetch_json(&body).await {
        Ok(data) => HttpResponse::Ok().json(success(data)),
        Err(error @ (ProviderError::InvalidProvider | ProviderError::InvalidPath)) => {
            HttpResponse::BadRequest().json(failed(&AppError::bad_request(error.code())))
        }
        Err(error) => HttpResponse::BadGateway().json(failed(&AppError::new(502, error.code()))),
    }
}

#[post("/resource/download")]
pub async fn api_resource_download(body: web::Json<DownloadRequest>) -> impl Responder {
    match fetch_download_bytes(&body.url).await {
        Ok((bytes, content_type)) => {
            let mut builder = HttpResponse::Ok();
            builder.insert_header((
                actix_web::http::header::CONTENT_TYPE,
                content_type.unwrap_or_else(|| "application/octet-stream".to_owned()),
            ));
            builder.insert_header((actix_web::http::header::CONTENT_DISPOSITION, "attachment"));
            builder.body(bytes)
        }
        Err(
            error @ (ProviderError::InvalidProvider
            | ProviderError::InvalidPath
            | ProviderError::InvalidDownloadUrl),
        ) => HttpResponse::BadRequest().json(failed(&AppError::bad_request(error.code()))),
        Err(error) => HttpResponse::BadGateway().json(failed(&AppError::new(502, error.code()))),
    }
}

#[derive(Serialize)]
struct LegacyFailed {
    status: &'static str,
    err: &'static str,
}

fn get_client_ip(req: &HttpRequest) -> String {
    if let Some(xff) = req.headers().get("X-Forwarded-For") {
        if let Ok(xff_str) = xff.to_str() {
            for ip_str in xff_str.split(',').map(|s| s.trim()) {
                if ip_str.parse::<IpAddr>().is_ok() {
                    return ip_str.to_string();
                }
            }
        }
    }
    if let Some(xri) = req.headers().get("X-Real-IP") {
        if let Ok(xri_str) = xri.to_str() {
            if xri_str.parse::<IpAddr>().is_ok() {
                return xri_str.to_string();
            }
        }
    }
    if let Some(peer) = req.peer_addr() {
        return peer.ip().to_string();
    }
    "unknown".to_string()
}

fn client_meta(http_request: &HttpRequest) -> ClientMeta {
    let authorization = http_request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());
    let user_agent = http_request
        .headers()
        .get("User-Agent")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    ClientMeta {
        ip: get_client_ip(http_request),
        user_agent,
        authorization,
    }
}

fn respond(result: AppResult<Value>) -> HttpResponse {
    match result {
        Ok(data) => HttpResponse::Ok().json(success(data)),
        Err(err) => HttpResponse::build(
            actix_web::http::StatusCode::from_u16(err.status)
                .unwrap_or(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR),
        )
        .json(failed(&err)),
    }
}

async fn dispatch_http(
    method: &str,
    path: &str,
    body: Option<Value>,
    http_request: &HttpRequest,
) -> HttpResponse {
    if path.contains("desktop-session") {
        let ip = get_client_ip(http_request);
        if !is_loopback_ip(&ip) {
            return HttpResponse::Forbidden().json(LegacyFailed {
                status: "failed",
                err: "permission-denied",
            });
        }
    }
    respond(dispatch(ApiRequest {
        method: method.to_string(),
        path: path.to_string(),
        body,
        meta: client_meta(http_request),
    }))
}

#[get("/")]
pub async fn api_index() -> impl Responder {
    respond(Ok(Value::String("Hello from MCSL Future Web API!".into())))
}

macro_rules! simple {
    ($name:ident, $method:literal, $path:literal, $http:ident) => {
        #[$http($path)]
        pub async fn $name(http_request: HttpRequest) -> impl Responder {
            dispatch_http($method, $path, None, &http_request).await
        }
    };
}

simple!(
    api_account_desktop_session,
    "POST",
    "/account/desktop-session",
    post
);
simple!(
    api_account_should_register,
    "GET",
    "/account/should-register",
    get
);
simple!(api_account_logout, "GET", "/account/logout", get);
simple!(api_user_get_info_self, "GET", "/user/info/self", get);
simple!(api_user_get_info_all, "GET", "/user/info/all", get);
simple!(api_session_get_self, "GET", "/session/self", get);
simple!(api_session_get_all, "GET", "/session/all", get);
simple!(api_session_delete_self, "DELETE", "/session/self", delete);
simple!(api_nodes_list, "GET", "/nodes", get);
simple!(api_preferences_get, "GET", "/preferences", get);

#[post("/account/login")]
pub async fn api_account_login(
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "POST",
        "/account/login",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[post("/account/register")]
pub async fn api_account_register(
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "POST",
        "/account/register",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[post("/user/create")]
pub async fn api_user_create(data: web::Json<Value>, http_request: HttpRequest) -> impl Responder {
    dispatch_http(
        "POST",
        "/user/create",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[put("/user/info/{username}")]
pub async fn api_user_update_info(
    username: web::Path<String>,
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "PUT",
        &format!("/user/info/{}", username.into_inner()),
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[delete("/user/{username}")]
pub async fn api_user_delete(
    username: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "DELETE",
        &format!("/user/{}", username.into_inner()),
        None,
        &http_request,
    )
    .await
}

#[put("/user/password")]
pub async fn api_user_update_password(
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "PUT",
        "/user/password",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[delete("/session/{id}")]
pub async fn api_session_delete_id(
    id: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "DELETE",
        &format!("/session/{}", id.into_inner()),
        None,
        &http_request,
    )
    .await
}

#[delete("/session/{username}")]
pub async fn api_session_delete_username(
    username: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "DELETE",
        &format!("/session/{}", username.into_inner()),
        None,
        &http_request,
    )
    .await
}

#[get("/nodes/{id}/token")]
pub async fn api_nodes_get_token(
    id: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "GET",
        &format!("/nodes/{}/token", id.into_inner()),
        None,
        &http_request,
    )
    .await
}

#[post("/nodes")]
pub async fn api_nodes_create(data: web::Json<Value>, http_request: HttpRequest) -> impl Responder {
    dispatch_http("POST", "/nodes", Some(data.into_inner()), &http_request).await
}

#[put("/nodes/{id}")]
pub async fn api_nodes_update(
    id: web::Path<String>,
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "PUT",
        &format!("/nodes/{}", id.into_inner()),
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[put("/nodes/{id}/visibility")]
pub async fn api_nodes_set_visibility(
    id: web::Path<String>,
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "PUT",
        &format!("/nodes/{}/visibility", id.into_inner()),
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[delete("/nodes/{id}")]
pub async fn api_nodes_delete(id: web::Path<String>, http_request: HttpRequest) -> impl Responder {
    dispatch_http(
        "DELETE",
        &format!("/nodes/{}", id.into_inner()),
        None,
        &http_request,
    )
    .await
}

#[post("/nodes/import")]
pub async fn api_nodes_import(data: web::Json<Value>, http_request: HttpRequest) -> impl Responder {
    dispatch_http(
        "POST",
        "/nodes/import",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}

#[put("/preferences")]
pub async fn api_preferences_put(
    data: web::Json<Value>,
    http_request: HttpRequest,
) -> impl Responder {
    dispatch_http(
        "PUT",
        "/preferences",
        Some(data.into_inner()),
        &http_request,
    )
    .await
}
