use serde::Serialize;

/// 传输无关业务错误。HTTP（Actix）与 Tauri IPC 共用同一套 code。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AppError {
    pub status: u16,
    pub code: &'static str,
}

impl AppError {
    pub const fn new(status: u16, code: &'static str) -> Self {
        Self { status, code }
    }

    pub fn bad_request(code: &'static str) -> Self {
        Self::new(400, code)
    }

    pub fn unauthorized(code: &'static str) -> Self {
        Self::new(401, code)
    }

    pub fn forbidden(code: &'static str) -> Self {
        Self::new(403, code)
    }

    pub fn not_found(code: &'static str) -> Self {
        Self::new(404, code)
    }

    pub fn conflict(code: &'static str) -> Self {
        Self::new(409, code)
    }

    pub fn internal() -> Self {
        Self::new(500, "internal-server-error")
    }
}

#[derive(Serialize)]
pub struct SuccessEnvelope<T> {
    pub status: &'static str,
    pub data: T,
}

#[derive(Serialize)]
pub struct FailedEnvelope {
    pub status: &'static str,
    pub err: &'static str,
}

pub fn success<T>(data: T) -> SuccessEnvelope<T> {
    SuccessEnvelope {
        status: "success",
        data,
    }
}

pub fn failed(err: &AppError) -> FailedEnvelope {
    FailedEnvelope {
        status: "failed",
        err: err.code,
    }
}

/// Tauri / 前端统一响应：与 HTTP envelope 对齐，额外带 HTTP 语义 status。
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InvokeResponse<T> {
    pub ok: bool,
    pub status: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub err: Option<&'static str>,
}

impl<T> InvokeResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            ok: true,
            status: 200,
            data: Some(data),
            err: None,
        }
    }

    pub fn err(error: AppError) -> Self {
        Self {
            ok: false,
            status: error.status,
            data: None,
            err: Some(error.code),
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
