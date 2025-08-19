import MarkdownIt from "markdown-it";
import * as xss from "xss";
import hljs from "highlight.js";

export const configuredXss = new xss.FilterXSS({
  whiteList: {
    ...xss.whiteList,
    summary: [],
    h1: ["id"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    h5: ["id"],
    h6: ["id"],
    kbd: ["id"],
    input: ["checked", "disabled", "type"],
    iframe: [
      "width",
      "height",
      "allowfullscreen",
      "frameborder",
      "start",
      "end",
    ],
    img: [...(xss.whiteList.img || []), "usemap", "style", "align"],
    map: ["name"],
    area: [...(xss.whiteList.a || []), "coords"],
    a: [...(xss.whiteList.a || []), "rel"],
    td: [...(xss.whiteList.td || []), "style"],
    th: [...(xss.whiteList.th || []), "style"],
    picture: [],
    source: ["media", "sizes", "src", "srcset", "type"],
    p: [...(xss.whiteList.p || []), "align"],
    div: [...(xss.whiteList.p || []), "align"],
  },
  css: {
    whiteList: {
      "image-rendering": /^pixelated$/,
      "text-align": /^center|left|right$/,
      float: /^left|right$/,
    },
  },
  onIgnoreTagAttr: (tag, name, value) => {
    // 允许嵌入iframe的网站
    if (tag === "iframe" && name === "src") {
      const allowedSources = [
        {
          url: /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]{11}/,
          allowedParameters: [/start=\d+/, /end=\d+/],
        },
        {
          url: /^https?:\/\/(www\.)?discord\.com\/widget/,
          allowedParameters: [/id=\d{18,19}/],
        },
        {
          url: /^https?:\/\/player.bilibili.com\/player.html/,
          allowedParameters: [/bvid=BV[a-zA-Z0-9]{10}/],
        },
      ];

      const url = new URL(value);

      for (const source of allowedSources) {
        if (!source.url.test(url.href)) {
          continue;
        }

        const newSearchParams = new URLSearchParams();
        url.searchParams.forEach((value, key) => {
          if (
            !source.allowedParameters.some((param) =>
              param.test(`${key}=${value}`),
            )
          ) {
            newSearchParams.delete(key);
          }
        });

        url.search = newSearchParams.toString();
        return `${name}="${xss.escapeAttrValue(url.toString())}"`;
      }
    }

    // Highlight.JS
    if (name === "class" && ["pre", "code", "span"].includes(tag)) {
      const allowedClasses: string[] = [];
      for (const className of value.split(/\s/g)) {
        if (
          className.startsWith("hljs-") ||
          className.startsWith("language-")
        ) {
          allowedClasses.push(className);
        }
      }
      return `${name}="${xss.escapeAttrValue(allowedClasses.join(" "))}"`;
    }
  },
  safeAttrValue(tag, name, value, cssFilter) {
    if (
      (tag === "img" ||
        tag === "video" ||
        tag === "audio" ||
        tag === "source") &&
      (name === "src" || name === "srcset") &&
      !value.startsWith("data:")
    ) {
      try {
        const url = new URL(value);

        if (url.hostname.includes("wsrv.nl")) {
          url.searchParams.delete("errorredirect");
        }

        const allowedHostnames = [
          "imgur.com",
          "i.imgur.com",
          "cdn-raw.modrinth.com",
          "cdn.modrinth.com",
          "staging-cdn-raw.modrinth.com",
          "staging-cdn.modrinth.com",
          "github.com",
          "raw.githubusercontent.com",
          "img.shields.io",
          "i.postimg.cc",
          "wsrv.nl",
          "bstats.org",
          "media.forgecdn.net",
          "i.mcmod.cn",
        ];

        if (!allowedHostnames.includes(url.hostname)) {
          return xss.safeAttrValue(
            tag,
            name,
            `https://wsrv.nl/?url=${encodeURIComponent(
              url.toString().replaceAll("&amp;", "&"),
            )}&n=-1`,
            cssFilter,
          );
        }
        return xss.safeAttrValue(tag, name, url.toString(), cssFilter);
      } catch {
        /* ignore */
      }
    }

    return xss.safeAttrValue(tag, name, value, cssFilter);
  },
});

export const md = (options = {}) => {
  const md = new MarkdownIt("default", {
    html: true,
    linkify: true,
    breaks: false,
    ...options,
  });

  md.renderer.rules.link_open = function (tokens, idx, options, _env, self) {
    const token = tokens[idx]!;
    const index = token.attrIndex("href");

    token.attrSet("target", "_blank");

    if (token.attrs && index !== -1) {
      const href = token.attrs[index]![1];

      try {
        const url = new URL(href, location.href);

        if (url.origin === location.origin) {
          token.attrSet("target", "_self");
        }
      } catch {
        /* ignore */
      }
    }

    tokens[idx]!.attrSet("rel", "noopener norefferrer nofollow ugc");

    return self.renderToken(tokens, idx, options);
  };

  return md;
};

hljs.registerAliases(["js"], { languageName: "javascript" });
hljs.registerAliases(["py"], { languageName: "python" });
hljs.registerAliases(["kt"], { languageName: "kotlin" });
hljs.registerAliases(["json5"], { languageName: "json" });
hljs.registerAliases(["toml"], { languageName: "ini" });
hljs.registerAliases(["yml"], { languageName: "yaml" });
hljs.registerAliases(["html", "htm", "xhtml", "mcui", "fxml"], {
  languageName: "xml",
});

export const renderHtml = (string: string) => configuredXss.process(string);

export const renderMd = (string: string) => renderHtml(md().render(string));

export const renderHighlightedMd = (string: string) =>
  renderHtml(
    md({
      highlight(str: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch {
            /* ignore */
          }
        }

        return "";
      },
    }).render(string),
  );
