globalThis.__nitro_main__ = import.meta.url;
import { i as serve, r as NodeResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
import { a as toEventHandler, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-08T17:00:42.853Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-08-08T17:00:42.853Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/Contact-DxfHrfkT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16e34-tEtPuwmfg9lwPRsK0LqqDhVeAI0\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 93748,
		"path": "../public/assets/Contact-DxfHrfkT.js"
	},
	"/assets/Faq-BYlqT3r2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f63-sRMJKtUZoZkmaQ+SLfR5ed6dLu8\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 8035,
		"path": "../public/assets/Faq-BYlqT3r2.js"
	},
	"/assets/Footer-BhtA1iPP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"66a8-Ez5K03KPSrpK0AObgQimxPXEoro\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 26280,
		"path": "../public/assets/Footer-BhtA1iPP.js"
	},
	"/assets/PageLayout-D6YvxG1y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"343-BAqUzg1MFDZf0uRJqnxUg8HDu/g\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 835,
		"path": "../public/assets/PageLayout-D6YvxG1y.js"
	},
	"/assets/WhyChooseUs-DGqUWXWa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f9d-6Xt3DnopY+8tCY/JTJN5gERoAoY\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 3997,
		"path": "../public/assets/WhyChooseUs-DGqUWXWa.js"
	},
	"/assets/about-DIKk2Tq0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22a-+OUppNm+gyQjcYbCFQqwnoMDSdw\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 554,
		"path": "../public/assets/about-DIKk2Tq0.js"
	},
	"/assets/admin-DO8LfX65.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"eba2-FltIJm4z/g3FbcOAySfhGn14WVE\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 60322,
		"path": "../public/assets/admin-DO8LfX65.js"
	},
	"/assets/auth-DzZa1hd6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"116f-MRfQjc63wFWyj95v0JFC/qEQ+XY\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 4463,
		"path": "../public/assets/auth-DzZa1hd6.js"
	},
	"/assets/check-BojF4SNe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7c-rH5HxkNAjLdAHjk0aVge61nihPw\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 124,
		"path": "../public/assets/check-BojF4SNe.js"
	},
	"/assets/Testimonials-C6WuMCAN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"797-m5sxklHbbWP+w1M0GNHyc19VGi8\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 1943,
		"path": "../public/assets/Testimonials-C6WuMCAN.js"
	},
	"/assets/chevron-down-BAc3sJOq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"80-69/99zJpGRD8hrALWj9gpdinsqo\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 128,
		"path": "../public/assets/chevron-down-BAc3sJOq.js"
	},
	"/assets/contact-DEHrm1Rh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f8-Glusr7eRV0jwZkk/LNx4h+Ypzt4\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 504,
		"path": "../public/assets/contact-DEHrm1Rh.js"
	},
	"/assets/Services-B8qzr6w1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"606-/+ZveSm8P1DG86R4B46j0sH737E\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 1542,
		"path": "../public/assets/Services-B8qzr6w1.js"
	},
	"/assets/createLucideIcon-EwxHN4ny.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"393e3-ynEoLPJRc1MVuOXawslBmy4rAz0\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 234467,
		"path": "../public/assets/createLucideIcon-EwxHN4ny.js"
	},
	"/assets/consultant-portrait-DTypfQSy.jpg": {
		"type": "image/jpeg",
		"etag": "\"1e68d-hOFZvEw+DWBDngeLSksVjw8U7xk\"",
		"mtime": "2026-08-08T17:00:41.840Z",
		"size": 124557,
		"path": "../public/assets/consultant-portrait-DTypfQSy.jpg"
	},
	"/assets/google-workspace-CzdxP2OP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"242f6-hp5cmg/RYXCSJk7iVn8Uc412G1Y\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 148214,
		"path": "../public/assets/google-workspace-CzdxP2OP.js"
	},
	"/assets/faq-Cgrlz7rz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1af-jR7pGbML+aGog1bymu1Qlz+AUGM\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 431,
		"path": "../public/assets/faq-Cgrlz7rz.js"
	},
	"/assets/lock-hVxZJN0A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce-JhCuI38lu3jGNqspXlybGwOhsio\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 206,
		"path": "../public/assets/lock-hVxZJN0A.js"
	},
	"/assets/matchContext-D_yddPR9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9f-wWjKu0sVEElxUaP6aCcICk1/1Aw\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 159,
		"path": "../public/assets/matchContext-D_yddPR9.js"
	},
	"/assets/not-found-DIgawKw1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"37-RTB6YH5iXRKeXz1Sn6ZQ+vS0lnc\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 55,
		"path": "../public/assets/not-found-DIgawKw1.js"
	},
	"/assets/index-BYcj1pR8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"44d7a-0qfPdeqpW1lUYjrwyGXf3KasPzo\"",
		"mtime": "2026-08-08T17:00:41.838Z",
		"size": 281978,
		"path": "../public/assets/index-BYcj1pR8.js"
	},
	"/assets/hero-office-DYUyMW_J.jpg": {
		"type": "image/jpeg",
		"etag": "\"2132e-aX/zZhcyLx7BxsmgSrl/0mvD9JE\"",
		"mtime": "2026-08-08T17:00:41.840Z",
		"size": 135982,
		"path": "../public/assets/hero-office-DYUyMW_J.jpg"
	},
	"/assets/label-BJf0VNW5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"105d7-EoJIi2T1CB42+685RqP4B/wzMLs\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 67031,
		"path": "../public/assets/label-BJf0VNW5.js"
	},
	"/assets/reviews-CDT7VUar.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1dd-fI4gDFTDhozhgzEmJb0NhrC9n2I\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 477,
		"path": "../public/assets/reviews-CDT7VUar.js"
	},
	"/assets/route-CDy9eOUJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a-BDA8U4Z5P1Y7nJMvTv7OBj7oJ3w\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 138,
		"path": "../public/assets/route-CDy9eOUJ.js"
	},
	"/assets/routes-27UHbKLO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"133-PYD/hqsf/FTHs4eZbsRpqlBPjlo\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 307,
		"path": "../public/assets/routes-27UHbKLO.js"
	},
	"/assets/routes-AZOiGgxe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b-hNaz66JBsLjkFlH5HNcou+7ow4s\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 139,
		"path": "../public/assets/routes-AZOiGgxe.js"
	},
	"/assets/routes-HyT1LBZS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4628-efCI8nmoa/IpvFy2QtTaY9xcSaI\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 17960,
		"path": "../public/assets/routes-HyT1LBZS.js"
	},
	"/assets/select-kD5oWF6P.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c477-fgLRIyVN/qmeJHIcKcR8jS5od/g\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 50295,
		"path": "../public/assets/select-kD5oWF6P.js"
	},
	"/assets/services-Cm9K1xbD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f1-RbQdAx1i1R8n0kdpK+mJHMQeoWA\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 497,
		"path": "../public/assets/services-Cm9K1xbD.js"
	},
	"/assets/site-content-BRlrcRWU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b5be-y8W8qBCX/Odnqz+wTu0WNVErRMs\"",
		"mtime": "2026-08-08T17:00:41.839Z",
		"size": 46526,
		"path": "../public/assets/site-content-BRlrcRWU.js"
	},
	"/assets/styles-CXViLHyc.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1674f-MsnYJs8LAQwRVWbq87QdpxGsPks\"",
		"mtime": "2026-08-08T17:00:41.840Z",
		"size": 91983,
		"path": "../public/assets/styles-CXViLHyc.css"
	},
	"/assets/textarea-2sKm6lHc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"35f-LOvO24pg4lOw/vwLXFLUuybjnT8\"",
		"mtime": "2026-08-08T17:00:41.840Z",
		"size": 863,
		"path": "../public/assets/textarea-2sKm6lHc.js"
	},
	"/assets/useStore-CP8wJgJA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2918-0tLldaM8Qq78X/SAr5J1mOpDbnY\"",
		"mtime": "2026-08-08T17:00:41.840Z",
		"size": 10520,
		"path": "../public/assets/useStore-CP8wJgJA.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_0jRgqU = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_0jRgqU
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
