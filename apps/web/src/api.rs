use crate::token::{
    create_session, delete_token, delete_token_by_id, delete_token_by_username, get_session_info_by_id,
    get_session_infos, get_tokens_by_user, get_user_by_token, update_token_info,
    SessionInfo,
};
use crate::user::{
    add_user, delete_user, get_users, is_user_empty, update_user, verify_password, User, UserInput,
    UserOutput,
};
use actix_web::{delete, get, post, put, web, HttpRequest, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::net::IpAddr;

#[derive(Serialize)]
pub struct SuccessResponse<T> {
    pub status: &'static str,
    pub data: T,
}

#[derive(Serialize)]
pub struct FailedResponse {
    pub status: &'static str,
    pub err: &'static str,
}

fn get_client_ip(req: &HttpRequest) -> String {
    if let Some(xff) = req.headers().get("X-Forwarded-For") {
        if let Ok(xff_str) = xff.to_str() {
            // X-Forwarded-For: client_ip, proxy1_ip, proxy2_ip...
            let xff_ips: Vec<&str> = xff_str.split(',').map(|s| s.trim()).collect();
            for ip_str in xff_ips {
                if let Ok(_) = ip_str.parse::<IpAddr>() {
                    return ip_str.to_string();
                }
            }
        }
    }

    if let Some(xri) = req.headers().get("X-Real-IP") {
        if let Ok(xri_str) = xri.to_str() {
            if let Ok(_) = xri_str.parse::<IpAddr>() {
                return xri_str.to_string();
            }
        }
    }

    if let Some(peer) = req.peer_addr() {
        let ip = peer.ip();
        return ip.to_string();
    }

    "unknown".to_string()
}

fn get_token_from_headers(http_request: &HttpRequest) -> Option<&str> {
    match http_request.headers().get("Authorization") {
        Some(header) => match header.to_str() {
            Ok(value) => {
                if value.starts_with("Bearer ") {
                    Some(&value[7..])
                } else {
                    None
                }
            }
            Err(_) => None,
        },
        None => None,
    }
}

fn get_optional_user_from_headers(http_request: &HttpRequest) -> Option<User> {
    let token = get_token_from_headers(http_request)?;

    match get_user_by_token(token) {
        Ok(user) => {
            update_token_info(token, &get_client_ip(http_request));
            Some(user)
        }
        Err(_) => None,
    }
}

fn get_user_from_headers(http_request: &HttpRequest) -> Result<User, HttpResponse> {
    match get_optional_user_from_headers(http_request) {
        Some(user) => Ok(user),
        None => Err(HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        })),
    }
}

fn verify_user_permission(
    http_request: &HttpRequest,
    permission: String,
) -> Result<User, HttpResponse> {
    let user = get_user_from_headers(http_request)?;
    if user.verify_permission(&permission).unwrap_or(false) {
        return Err(HttpResponse::Forbidden().json(FailedResponse {
            status: "failed",
            err: "permission-denied",
        }));
    }
    Ok(user)
}

#[get("/")]
pub async fn api_index() -> impl Responder {
    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: "Hello from MCSL Future Web API!",
    })
}

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
    remember: bool,
}

#[post("/account/login")]
pub async fn api_account_login(
    data: web::Json<LoginRequest>,
    http_request: HttpRequest,
) -> impl Responder {
    let user = match verify_password(&data.username, &data.password) {
        Ok(user) => user,
        Err(res) => return res,
    };

    match create_session(
        &user.username,
        data.remember,
        get_client_ip(&http_request),
        http_request
            .headers()
            .get("User-Agent")
            .unwrap()
            .to_str()
            .unwrap()
            .to_string(),
    ) {
        Ok(token_pair) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: token_pair,
        }),
        Err(res) => res,
    }
}

#[get("/account/should-register")]
pub async fn api_account_should_register() -> impl Responder {
    let is_user_empty = match is_user_empty() {
        Ok(bool) => bool,
        Err(res) => return res,
    };

    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: is_user_empty,
    })
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    username: String,
    password: String,
}

#[post("/account/register")]
pub async fn api_account_register(data: web::Json<RegisterRequest>) -> impl Responder {
    let is_user_empty = match is_user_empty() {
        Ok(bool) => bool,
        Err(res) => return res,
    };

    if !is_user_empty {
        return HttpResponse::Forbidden().json(FailedResponse {
            status: "failed",
            err: "admin-exists",
        });
    }

    match add_user(UserInput {
        username: data.username.clone(),
        password: data.password.clone(),
        permissions: vec!["*".to_string()],
    }) {
        Ok(()) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[get("/account/logout")]
pub async fn api_account_logout(http_request: HttpRequest) -> impl Responder {
    let token = match get_token_from_headers(&http_request) {
        Some(token) => token,
        None => {
            return HttpResponse::Forbidden().json(FailedResponse {
                status: "failed",
                err: "invalid-token",
            });
        }
    };

    match delete_token(token) {
        Ok(()) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[post("/user/create")]
pub async fn api_user_create(
    data: web::Json<UserInput>,
    http_request: HttpRequest,
) -> impl Responder {
    if let Err(res) = verify_user_permission(&http_request, "mcsl.web.user.create".to_string()) {
        return res;
    }

    match add_user(data.into_inner()) {
        Ok(_) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[put("/user/info/{username}")]
pub async fn api_user_update_info(
    username: web::Path<String>,
    data: web::Json<UserInput>,
    http_request: HttpRequest,
) -> impl Responder {
    if let Err(res) = verify_user_permission(
        &http_request,
        format!("mcsl.web.user.{}.info.change", username),
    ) {
        return res;
    }

    match update_user(&username, data.into_inner()) {
        Ok(_) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[delete("/user/{username}")]
pub async fn api_user_delete(
    username: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    if let Err(res) =
        verify_user_permission(&http_request, format!("mcsl.web.user.{}.delete", username))
    {
        return res;
    }

    match delete_user(&username) {
        Ok(_) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    old_password: String,
    password: String,
}

#[put("/user/password")]
pub async fn api_user_update_password(
    data: web::Json<ChangePasswordRequest>,
    http_request: HttpRequest,
) -> impl Responder {
    let user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    if let Err(res) = user.verify_password(&data.old_password) {
        return res;
    }

    match update_user(
        &user.username,
        UserInput {
            username: user.username.clone(),
            password: data.password.clone(),
            permissions: user.info.permissions.clone(),
        },
    ) {
        Ok(_) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[get("/user/info/self")]
pub async fn api_user_get_info_self(http_request: HttpRequest) -> impl Responder {
    let user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: user.to_output(),
    })
}

#[get("/user/info/all")]
pub async fn api_user_get_info_all(http_request: HttpRequest) -> impl Responder {
    let current_user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    let users = match get_users() {
        Ok(users) => users,
        Err(res) => return res,
    };

    let filtered_users: Vec<UserOutput> = users
        .into_iter()
        .filter(|user| {
            if user.username == current_user.username {
                return true;
            }
            let read_permission = format!("mcsl.web.user.{}.info.read", user.username);
            let change_permission = format!("mcsl.web.user.{}.info.change", user.username);
            let delete_permission = format!("mcsl.web.user.{}.info.delete", user.username);
            current_user
                .verify_permission(&read_permission)
                .unwrap_or(false)
                || current_user
                    .verify_permission(&change_permission)
                    .unwrap_or(false)
                || current_user
                    .verify_permission(&delete_permission)
                    .unwrap_or(false)
        })
        .map(|user| user.to_output())
        .collect();

    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: filtered_users,
    })
}

#[get("/session/self")]
pub async fn api_session_get_self(http_request: HttpRequest) -> impl Responder {
    let user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    match get_tokens_by_user(&user) {
        Ok(tokens) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: tokens,
        }),
        Err(res) => res,
    }
}

#[delete("/session/{id}")]
pub async fn api_session_delete_id(
    id: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    let user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    let session_info = match get_session_info_by_id(&id) {
        Ok(info) => info,
        Err(res) => return res,
    };

    if session_info.user != user.username
        && !user
            .verify_permission(&format!("mcsl.web.user.{}.session.delete", user.username))
            .unwrap_or(false)
    {
        return HttpResponse::Forbidden().json(FailedResponse {
            status: "failed",
            err: "permission-denied",
        });
    }

    match delete_token_by_id(&id) {
        Ok(_) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[get("/session/all")]
pub async fn api_session_get_all(http_request: HttpRequest) -> impl Responder {
    let current_user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    let session_infos = match get_session_infos() {
        Ok(info) => info,
        Err(res) => return res,
    };

    let filtered_sessions: Vec<SessionInfo> = session_infos
        .into_iter()
        .filter(|session| {
            if session.user == current_user.username {
                return true;
            }
            let read_permission = format!("mcsl.web.user.{}.session.read", session.user);
            let delete_permission = format!("mcsl.web.user.{}.session.delete", session.user);
            current_user
                .verify_permission(&read_permission)
                .unwrap_or(false)
                || current_user
                    .verify_permission(&delete_permission)
                    .unwrap_or(false)
        })
        .collect();

    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: filtered_sessions,
    })
}

#[delete("/session/self")]
pub async fn api_session_delete_self(http_request: HttpRequest) -> impl Responder {
    let user = match get_user_from_headers(&http_request) {
        Ok(user) => user,
        Err(res) => return res,
    };

    match delete_token_by_username(&user.username) {
        Ok(()) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}

#[delete("/session/{username}")]
pub async fn api_session_delete_username(
    username: web::Path<String>,
    http_request: HttpRequest,
) -> impl Responder {
    if let Err(res) = verify_user_permission(
        &http_request,
        format!("mcsl.web.user.{}.session.delete", username),
    ) {
        return res;
    }

    match delete_token_by_username(&username) {
        Ok(()) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: (),
        }),
        Err(res) => res,
    }
}
