use crate::user::{get_user_by_id, get_users, User, UserInput};
use crate::utils::{verify_token, TokenPair};
use crate::{config::Config, user, utils};
use actix_web::http::header::HeaderMap;
use actix_web::{delete, get, post, put, web, HttpRequest, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

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

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    password: String,
}

pub fn get_user_from_headers_nullable(config: &Config, headers: &HeaderMap) -> Option<User> {
    let token = match headers.get("Authorization") {
        Some(header) => match header.to_str() {
            Ok(value) => {
                if value.starts_with("Bearer ") {
                    &value[7..]
                } else {
                    return None;
                }
            }
            Err(_) => {
                return None;
            }
        },
        None => {
            return None;
        }
    };

    match verify_token(token, &config.auth_secret) {
        Ok(claims) => get_user_by_id(claims.usr),
        Err(_) => None,
    }
}

pub fn get_user_from_headers(config: &Config, headers: &HeaderMap) -> Result<User, HttpResponse> {
    match get_user_from_headers_nullable(config, headers) {
        Some(user) => Ok(user),
        None => Err(HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        })),
    }
}

pub fn verify_user_permission<F>(
    config: &Config,
    http_request: &HttpRequest,
    permission: F,
) -> Result<User, HttpResponse>
where
    F: Fn(&User) -> String,
{
    let user = get_user_from_headers(&config, http_request.headers())?;
    if user.verify_permission(&permission(&user)).unwrap_or(false) {
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

#[post("/user/login")]
pub async fn api_user_login(
    data: web::Json<LoginRequest>,
    config: web::Data<Config>,
) -> impl Responder {
    match user::verify_password(&data.username, &data.password) {
        Ok(user) => match utils::generate_token_pair(user.id, &config.auth_secret) {
            Ok(token_pair) => HttpResponse::Ok().json(SuccessResponse {
                status: "success",
                data: token_pair,
            }),
            Err(res) => res,
        },
        Err(res) => res,
    }
}

#[post("/user/refresh")]
pub async fn api_user_refresh(
    data: web::Json<TokenPair>,
    config: web::Data<Config>,
) -> impl Responder {
    match utils::verify_token_pair(&data, &config.auth_secret) {
        Ok(claims) => {
            if get_user_by_id(claims.usr).is_none() {
                return HttpResponse::Unauthorized().json(FailedResponse {
                    status: "failed",
                    err: "invalid-token",
                });
            }
            match utils::generate_token_pair(claims.usr, &config.auth_secret) {
                Ok(token_pair) => HttpResponse::Ok().json(SuccessResponse {
                    status: "success",
                    data: token_pair,
                }),
                Err(res) => res,
            }
        }
        Err(res) => res,
    }
}

#[get("/user/should-register")]
pub async fn api_user_should_register() -> impl Responder {
    HttpResponse::Ok().json(SuccessResponse {
        status: "success",
        data: get_users().is_empty(),
    })
}

#[post("/user/register")]
pub async fn api_user_register(data: web::Json<LoginRequest>) -> impl Responder {
    if !get_users().is_empty() {
        return HttpResponse::Forbidden().json(FailedResponse {
            status: "failed",
            err: "admin-exists",
        });
    }

    match user::add_user(UserInput {
        name: data.username.clone(),
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

#[post("/user/create")]
pub async fn api_user_create(
    data: web::Json<UserInput>,
    config: web::Data<Config>,
    http_request: HttpRequest,
) -> impl Responder {
    match verify_user_permission(&config, &http_request, |_| {
        "mcsl.web.user.create".to_string()
    }) {
        Ok(_) => match user::add_user(data.into_inner()) {
            Ok(_) => HttpResponse::Ok().json(SuccessResponse {
                status: "success",
                data: (),
            }),
            Err(res) => res,
        },
        Err(res) => res,
    }
}

#[put("/user/{id}")]
pub async fn api_user_update(
    id: web::Path<u32>,
    data: web::Json<UserInput>,
    config: web::Data<Config>,
    http_request: HttpRequest,
) -> impl Responder {
    match verify_user_permission(&config, &http_request, |user| {
        format!("mcsl.web.user.{}.change", user.id)
    }) {
        Ok(_) => match user::update_user(*id, data.into_inner()) {
            Ok(_) => HttpResponse::Ok().json(SuccessResponse {
                status: "success",
                data: (),
            }),
            Err(res) => res,
        },
        Err(res) => res,
    }
}

#[delete("/user/{id}")]
pub async fn api_user_delete(
    id: web::Path<u32>,
    config: web::Data<Config>,
    http_request: HttpRequest,
) -> impl Responder {
    match verify_user_permission(&config, &http_request, |user| {
        format!("mcsl.web.user.{}.delete", user.id)
    }) {
        Ok(_) => match user::delete_user(*id) {
            Ok(_) => HttpResponse::Ok().json(SuccessResponse {
                status: "success",
                data: (),
            }),
            Err(res) => res,
        },
        Err(res) => res,
    }
}

#[put("/user/password")]
pub async fn api_user_update_password(
    data: web::Json<ChangePasswordRequest>,
    config: web::Data<Config>,
    http_request: HttpRequest,
) -> impl Responder {
    match get_user_from_headers(&config, http_request.headers()) {
        Ok(user) => {
            match user::update_user(
                user.id,
                UserInput {
                    name: user.name.clone(),
                    password: data.password.clone(),
                    permissions: user.permissions.clone(),
                },
            ) {
                Ok(_) => HttpResponse::Ok().json(SuccessResponse {
                    status: "success",
                    data: (),
                }),
                Err(res) => res,
            }
        }
        Err(res) => res,
    }
}

#[get("/user/self")]
pub async fn api_user_get_self(
    config: web::Data<Config>,
    http_request: HttpRequest,
) -> impl Responder {
    match get_user_from_headers(&config, http_request.headers()) {
        Ok(user) => HttpResponse::Ok().json(SuccessResponse {
            status: "success",
            data: user,
        }),
        Err(res) => res,
    }
}
