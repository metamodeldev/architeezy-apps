# Architeezy Application Gallery

**Live:** [apps.architeezy.com](https://apps.architeezy.com/)

A collection of example web applications built on the [Architeezy](https://architeezy.com) API. Each
app demonstrates a different way to visualise and interact with architecture models stored in
Architeezy.

## Apps

| App                   | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| [Graph](./src/graph/) | Interactive graph and table viewer for any Architeezy model |

## Building Your Own Architeezy App

Architeezy exposes a REST API that any web app can use to read models, navigate relationships, and
display architecture data. Here is a minimal guide to get started.

### 1. Browse the API

The full API reference is available at
**[https://architeezy.com/swagger-ui/index.html](https://architeezy.com/swagger-ui/index.html)**.

Key endpoints:

| Endpoint                                                                 | Description                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| `GET /api/models`                                                        | Paginated list of models the caller has access to |
| `GET /api/models/{scope}/{project}/{version}/{slug}/content?format=json` | Fetch a model's element and relationship data     |
| `GET /api/users/current`                                                 | Fetch the currently authenticated user's profile  |

Responses use [HAL](https://stateless.co/hal_specification.html) — follow `_links` for pagination
and related resources.

### 2. Authentication

Authentication is **optional** — public models are readable without a token. Signing in may unlock
additional models.

#### Option A — Popup OAuth flow (recommended for SPAs)

1. Open a popup to `https://architeezy.com/-/auth`.
2. After a successful login, the auth page posts a message back to your window:

   ```js
   window.opener.postMessage({ type: 'AUTH_SUCCESS', token: user.access_token }, '*');
   ```

3. Receive it in your app:

   ```js
   window.addEventListener('message', (e) => {
     if (e.data?.type === 'AUTH_SUCCESS') {
       authToken = e.data.token; // keep in memory only
     }
   });
   ```

4. Pass the token as a Bearer header on every API request:

   ```js
   fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
   ```

**Security note:** store the token **in memory only** — never in `localStorage` or cookies. This
avoids XSS-driven token theft. The trade-off is that the user must sign in again on each page load.

#### Option B — Cookie session (same-domain hosting)

If your app is served from the same domain as Architeezy, the browser's session cookie is sent
automatically when you include `credentials: "include"` in fetch calls. Call
`GET /api/users/current` on startup to probe whether a session exists.

### 3. Fetch the Model List

```js
async function fetchModels() {
  const models = [];
  let url = 'https://architeezy.com/api/models?size=100';
  while (url) {
    const r = await fetch(url, { credentials: 'include' });
    const data = await r.json();
    models.push(...(data._embedded?.models ?? []));
    const next = data._links?.next?.href;
    url = next !== url ? next : null;
  }
  return models;
}
```

### 4. Fetch Model Content

Each model object from the list contains a `_links.content` HAL link pointing to the model data:

```js
function contentUrl(model) {
  const link = model._links?.content;
  const href = Array.isArray(link) ? link[0]?.href : link?.href;
  return href?.replace(/\{[^}]*\}/g, ''); // strip URI template params
}

const r = await fetch(contentUrl(model) + '?format=json', {
  credentials: 'include',
});
const data = await r.json(); // { content: [...], ns: {...}, ... }
```

The response is an EMF/Ecore JSON export. The top-level `content` array contains model root objects;
each object has an `eClass` field and a recursive `data` property holding child objects, references,
and scalar values.

### 5. Parse the Model

Model objects follow a simple structural convention:

- An object with both `data.source` and `data.target` → **relationship** (edge)
- An object with `data.target` only → **reference edge** from its parent to the target
- Everything else → **element** (node), possibly containing nested children

See [`graph/js/parser.js`](./graph/js/parser.js) for a complete universal parser implementation.

### 6. No Build Step Required

All example apps are plain ES modules loaded directly in the browser — no bundler, no transpiler, no
`package.json`. Dependencies (Cytoscape.js etc.) are loaded from CDN via `<script>` tags.

## Running Locally

Serve the repo root with a static file server:

```sh
bun dev
```

Then open `http://localhost:3000` in your browser.
