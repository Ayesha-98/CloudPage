export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // Database viewer endpoint - add this
    if (url.pathname === "/db-view") {
      return obj.fetch(request);
    }

    // Serve your Cloudflare Pages site at root
    if (url.pathname === "/") {
      const page = await fetch("https://cloudflaredb-pages.yasir-ali.workers.dev");
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
      const data = [...entries.values()];
      return new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" }
      });
    }

    // Database viewer HTML page - add this
    if (url.pathname === "/db-view") {
      const entries = await this.storage.list();
      const data = [...entries.values()];
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Database Viewer</title>
          <style>
            body { font-family: Arial; margin: 40px; background: #f5f5f5; }
            table { border-collapse: collapse; width: 100%; background: white; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #0078d4; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            .stats { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>📊 Database Viewer</h1>
          <div class="stats">
            <strong>Total Records:</strong> ${data.length}
          </div>
          <table>
            <tr><th>#</th><th>Name</th><th>Email</th></tr>
            ${data.map((record, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${record.name || 'N/A'}</td>
                <td>${record.email || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
          <p><a href="/">← Back to Add Records</a></p>
        </body>
        </html>
      `;
      
      return new Response(html, { 
        headers: { "content-type": "text/html" } 
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
