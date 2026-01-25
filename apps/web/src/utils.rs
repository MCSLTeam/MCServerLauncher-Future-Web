use crate::api::FailedResponse;
use actix_web::HttpResponse;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn generate_random_secret(length: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                            abcdefghijklmnopqrstuvwxyz\
                            0123456789";

    let mut rng = rand::rng();
    (0..length)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub fn sha256(str: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(str);
    hex::encode(hasher.finalize())
}

#[derive(Serialize, Deserialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub typ: String,
    pub tid: String,
    pub usr: u32,
    pub exp: usize,
}

fn generate_token(
    token_type: &str,
    token_id: &str,
    user_id: u32,
    secret: &str,
    expiration_seconds: u64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let exp = (now + expiration_seconds) as usize;

    let claims = TokenClaims {
        typ: token_type.to_string(),
        tid: token_id.to_string(),
        usr: user_id,
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_token(token: &str, secret: &str) -> Result<TokenClaims, jsonwebtoken::errors::Error> {
    let claims = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?
    .claims;

    if claims.typ != "access" {
        return Err(jsonwebtoken::errors::Error::from(
            jsonwebtoken::errors::ErrorKind::InvalidToken,
        ));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    if claims.exp < now {
        return Err(jsonwebtoken::errors::Error::from(
            jsonwebtoken::errors::ErrorKind::ExpiredSignature,
        ));
    }

    Ok(claims)
}

pub fn verify_token_pair(
    token_pair: &TokenPair,
    secret: &str,
) -> Result<TokenClaims, HttpResponse> {
    let access_claims = decode::<TokenClaims>(
        &token_pair.access_token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| {
        HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        })
    })?
    .claims;

    let refresh_claims = decode::<TokenClaims>(
        &token_pair.refresh_token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| {
        HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        })
    })?
    .claims;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    if access_claims.typ != "access"
        || refresh_claims.typ != "refresh"
        || access_claims.tid != refresh_claims.tid
        || refresh_claims.exp < now
    {
        return Err(HttpResponse::Unauthorized().json(FailedResponse {
            status: "failed",
            err: "invalid-token",
        }));
    }
    Ok(access_claims)
}

pub fn generate_token_pair(user_id: u32, secret: &str) -> Result<TokenPair, HttpResponse> {
    let token_id = generate_random_secret(16);

    let access_token =
        generate_token("access", &token_id, user_id, secret, 86400).map_err(|_| {
            HttpResponse::InternalServerError().json(FailedResponse {
                status: "failed",
                err: "internal-server-error",
            })
        })?;

    let refresh_token =
        generate_token("refresh", &token_id, user_id, secret, 7 * 86400).map_err(|_| {
            HttpResponse::InternalServerError().json(FailedResponse {
                status: "failed",
                err: "internal-server-error",
            })
        })?;

    Ok(TokenPair {
        access_token,
        refresh_token,
    })
}
