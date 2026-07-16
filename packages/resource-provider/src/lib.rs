use reqwest::Url;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ProviderRequest {
    pub provider: String,
    pub path: String,
    pub query: Option<Vec<(String, String)>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DownloadRequest {
    pub url: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProviderError {
    InvalidProvider,
    InvalidPath,
    InvalidDownloadUrl,
    ProviderUnavailable,
    InvalidProviderResponse,
}

impl ProviderError {
    pub const fn code(self) -> &'static str {
        match self {
            Self::InvalidProvider => "invalid-provider",
            Self::InvalidPath => "invalid-path",
            Self::InvalidDownloadUrl => "invalid-download-url",
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

/// 资源文件下载 URL 白名单（禁止开放代理）。
/// 覆盖五源 API / CDN，以及 BMCLAPI 等常用镜像主机。
pub fn validate_download_url(raw: &str) -> Result<Url, ProviderError> {
    let url = Url::parse(raw.trim()).map_err(|_| ProviderError::InvalidDownloadUrl)?;
    if url.scheme() != "https" && url.scheme() != "http" {
        return Err(ProviderError::InvalidDownloadUrl);
    }
    let host = url.host_str().unwrap_or("").to_ascii_lowercase();
    if host.is_empty() {
        return Err(ProviderError::InvalidDownloadUrl);
    }

    const EXACT: &[&str] = &[
        "download.fastmirror.net",
        "mirror.polars.cc",
        "mirrors.rainyun.com",
        "api.mslmc.cn",
        "sync.mcsl.com.cn",
        "bmclapi2.bangbang93.com",
        "bmclapi.bangbang93.com",
        "files.minecraftforge.net",
        "maven.minecraftforge.net",
        "maven.neoforged.net",
        "meta.fabricmc.net",
        "maven.fabricmc.net",
        "meta.quiltmc.org",
        "maven.quiltmc.org",
        "launcher.mojang.com",
        "piston-data.mojang.com",
        "piston-meta.mojang.com",
        "libraries.minecraft.net",
    ];

    const SUFFIX: &[&str] = &[
        ".fastmirror.net",
        ".polars.cc",
        ".rainyun.com",
        ".rainyun.net",
        ".mslmc.cn",
        ".mcsl.com.cn",
        ".bangbang93.com",
        ".minecraftforge.net",
        ".neoforged.net",
        ".fabricmc.net",
        ".quiltmc.org",
        ".mojang.com",
        ".minecraft.net",
    ];

    if EXACT.iter().any(|h| host == *h) || SUFFIX.iter().any(|s| host.ends_with(s)) {
        return Ok(url);
    }
    Err(ProviderError::InvalidDownloadUrl)
}

fn client() -> reqwest::Client {
    reqwest::Client::new()
}

pub async fn fetch_json(request: &ProviderRequest) -> Result<serde_json::Value, ProviderError> {
    let response = client()
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

/// 下载完整文件到内存（用于同源代理 / Tauri 落盘前缓冲）。
pub async fn fetch_download_bytes(raw_url: &str) -> Result<(Vec<u8>, Option<String>), ProviderError> {
    let url = validate_download_url(raw_url)?;
    let response = client()
        .get(url)
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

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_owned());

    let bytes = response
        .bytes()
        .await
        .map_err(|_| ProviderError::ProviderUnavailable)?
        .to_vec();
    Ok((bytes, content_type))
}

/// 下载到本地路径，返回字节数。
pub async fn download_to_path(raw_url: &str, dest: &Path) -> Result<u64, ProviderError> {
    let (bytes, _) = fetch_download_bytes(raw_url).await?;
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|_| ProviderError::ProviderUnavailable)?;
    }
    std::fs::write(dest, &bytes).map_err(|_| ProviderError::ProviderUnavailable)?;
    Ok(bytes.len() as u64)
}

#[cfg(test)]
mod tests {
    use super::{ProviderError, ProviderRequest, build_url, validate_download_url};

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

    #[test]
    fn allows_known_download_hosts() {
        assert!(
            validate_download_url(
                "https://download.fastmirror.net/download/paper/1.21.1/build"
            )
            .is_ok()
        );
        assert!(
            validate_download_url("https://bmclapi2.bangbang93.com/version/1.21.1/server")
                .is_ok()
        );
    }

    #[test]
    fn rejects_arbitrary_download_hosts() {
        assert_eq!(
            validate_download_url("https://evil.example/malware.jar"),
            Err(ProviderError::InvalidDownloadUrl)
        );
    }
}
