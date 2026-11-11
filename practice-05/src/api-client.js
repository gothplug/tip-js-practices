export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// baseUrl: абсолютный http(s)-адрес без query и hash. Ошибка конфигурации — TypeError.
function parseBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError(`baseUrl должен быть абсолютным адресом: ${baseUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`baseUrl должен использовать http или https: ${baseUrl}`);
  }
  if (url.search !== "" || url.hash !== "" || baseUrl.includes("?") || baseUrl.includes("#")) {
    throw new TypeError("baseUrl не должен содержать query и hash.");
  }
  return url;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = parseBaseUrl(baseUrl);

  if (typeof path !== "string") {
    throw new TypeError("path должен быть строкой.");
  }
  // Краевые "/" убираются, чтобы при соединении не получилось "api//tasks".
  const relativePath = path.trim().replace(/^\/+|\/+$/g, "");
  if (relativePath === "" || relativePath.includes("://")) {
    throw new TypeError(`path должен быть непустым относительным путём: ${path}`);
  }
  if (!isPlainObject(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  const basePath = base.pathname.replace(/\/+$/, "");
  const url = new URL(`${basePath}/${relativePath}`, base.origin);

  // Пропускаются только undefined, null и "": false и 0 — содержательные значения.
  // Входной объект только читается.
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }

  return url.toString();
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  parseBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!isPositiveSafeInteger(timeoutMs)) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }

  async function requestJson(path, {
    query = {},
    signal,
    timeoutMs: requestTimeoutMs = timeoutMs,
  } = {}) {
    const url = buildUrl(baseUrl, path, query);

    if (!isPositiveSafeInteger(requestTimeoutMs)) {
      throw new TypeError("timeoutMs должен быть положительным целым числом.");
    }
    if (signal !== undefined && !(signal instanceof AbortSignal)) {
      throw new TypeError("signal должен быть AbortSignal.");
    }

    // Собственный сигнал тайм-аута хранится отдельно: по нему отличается
    // timeout от отмены вызывающим кодом.
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    function abortError(cause) {
      if (signal?.aborted) {
        return new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
      }
      if (timeoutSignal.aborted) {
        return new ApiError(
          `Превышено время ожидания ответа (${requestTimeoutMs} мс).`,
          { kind: "timeout", url, cause },
        );
      }
      return null;
    }

    // Отдельный try только для сетевого этапа: ApiError, созданные ниже
    // при обработке Response, сюда не попадают и не становятся network.
    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: combinedSignal,
      });
    } catch (error) {
      throw abortError(error)
        ?? new ApiError("Сервер недоступен: ответ не получен.", { kind: "network", url, cause: error });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул значение, не являющееся Response.", {
        kind: "invalid-response",
        url,
      });
    }

    // Сначала статус: HTML-страница с 502 остаётся HTTP-ошибкой, а не ошибкой формата.
    if (!response.ok) {
      let payload = null;
      try {
        const type = response.headers.get("content-type") ?? "";
        if (type.includes("application/json")) payload = await response.json();
      } catch {
        // Тело ошибки повреждено: вид http и статус сохраняются.
        payload = null;
      }
      const apiError = payload?.error;
      throw new ApiError(
        typeof apiError?.message === "string" && apiError.message !== ""
          ? apiError.message
          : `HTTP ${response.status}: запрос не выполнен.`,
        {
          kind: "http",
          status: response.status,
          code: typeof apiError?.code === "string" ? apiError.code : null,
          details: apiError?.details ?? null,
          url,
        },
      );
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError(`Ожидался JSON, получен Content-Type: ${contentType || "не указан"}.`, {
        kind: "invalid-response",
        url,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        const aborted = abortError(error);
        if (aborted) throw aborted;
      }
      throw new ApiError("Ответ сервера содержит некорректный JSON.", {
        kind: "invalid-response",
        url,
        cause: error,
      });
    }
  }

  return { requestJson };
}
