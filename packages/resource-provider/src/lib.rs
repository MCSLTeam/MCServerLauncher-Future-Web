use reqwest::Url;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ProviderRequest {
    pub provider: String,
    pub path: String,
    pub query: Option<Vec<(String, String)>>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProviderError {
    InvalidProvider,
    InvalidPath,
    ProviderUnavailable,
    InvalidProviderResponse,
}

impl ProviderError {
    pub const fn code(self) -> &'static str {
        match self {
            Self::InvalidProvider => "invalid-provider",
            Self::InvalidPath => "invalid-path",
            Self::ProviderUnavailable => "provider-unavailable",
            Self::InvalidProviderResponse => "invalid-provider-response",
        }
    }
}

pub fn build_url(request: &ProviderRequest) -> Result<Url, ProviderError> {
    let base = match request.provider.as_str() {
        "FastMirror" => "https://download.fastmirror.net/api/v3",
        "PolarsMirror" => "https://mirror.polars.cc/api/query/minecraft",
        "RainYun" => "https://mirrors.rainyun.com/api/fs",
        "MSLAPI" => "https://api.mslmc.cn/v3",
        "MCSLSync" => "https://sync.mcsl.com.cn/api",
        _ => return Err(ProviderError::InvalidProvider),
    };

    if request.path.contains("..") || request.path.contains('\0') {
        return Err(ProviderError::InvalidPath);
    }

    let suffix = request.path.trim_start_matches('/');
    let mut url =
        Url::parse(&format!("{base}/{suffix}")).map_err(|_| ProviderError::InvalidPath)?;
    if let Some(query) = &request.query {
        url.query_pairs_mut().extend_pairs(query);
    }
    Ok(url)
}

pub async fn fetch_json(request: &ProviderRequest) -> Result<serde_json::Value, ProviderError> {
    let response = reqwest::Client::new()
        .get(build_url(request)?)
        .header(reqwest::header::ACCEPT, "application/json")
        .header(
            reqwest::header::USER_AGENT,
            "MCServerLauncher-Future-Web/0.1",
        )
        .send()
        .await
        .map_err(|_| ProviderError::ProviderUnavailable)?;

    if !response.status().is_success() {
        return Err(ProviderError::ProviderUnavailable);
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|_| ProviderError::ProviderUnavailable)?;
    serde_json::from_slice(&bytes).map_err(|_| ProviderError::InvalidProviderResponse)
}

#[cfg(test)]
mod tests {
    use super::{ProviderError, ProviderRequest, build_url};

    #[test]
    fn builds_only_whitelisted_provider_urls() {
        let request = ProviderRequest {
            provider: "FastMirror".into(),
            path: "/paper/1.21.4".into(),
            query: Some(vec![("limit".into(), "25".into())]),
        };

        let url = build_url(&request).expect("whitelisted provider should be accepted");

        assert_eq!(
            url.as_str(),
            "https://download.fastmirror.net/api/v3/paper/1.21.4?limit=25"
        );
    }

    #[test]
    fn rejects_unknown_providers() {
        let request = ProviderRequest {
            provider: "ArbitraryProxy".into(),
            path: String::new(),
            query: None,
        };

        assert_eq!(build_url(&request), Err(ProviderError::InvalidProvider));
    }

    #[test]
    fn rejects_path_traversal() {
        let request = ProviderRequest {
            provider: "FastMirror".into(),
            path: "../secret".into(),
            query: None,
        };

        assert_eq!(build_url(&request), Err(ProviderError::InvalidPath));
    }
}
