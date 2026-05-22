export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // Serve your Cloudflare Pages site at root
    if (url.pathname === "/") {
      const page = await fetch("https://cloudflaredb-pages.yasir-ali.workers.dev"); // ← replace with your Pages URL if different
      const html = await page.text();
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // Forward other routes to Durable Object
    return obj.fetch(request);
  }
}

export class MyDatabase {
  constructor(state, env) {
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/add") {
      const { name, email } = await request.json();
      await this.storage.put(name, { email });
      return new Response("Added successfully");
    }

    if (url.pathname === "/list") {
      const entries = await this.storage.list();
      return new Response(JSON.stringify([...entries.values()]), {
        headers: { "content-type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
