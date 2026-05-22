export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // Database viewer endpoint
    if (url.pathname === "/db-view") {
      return obj.fetch(request);
    }

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Serve your Cloudflare Pages site at root
    if (url.pathname === "/") {
      const page = await fetch("https://cloudpage-7k2.pages.dev");
      const html = await page.text();
      return new Response(html, { headers: { 
        "content-type": "text/html",
        "Access-Control-Allow-Origin": "*"
      }});
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
      await this.storage.put(name, { name, email });
      return new Response("Added successfully", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    if (url.pathname === "/list") {
      const entries = await this.storage.list();
      const data = Array.from(entries.values());
      return new Response(JSON.stringify(data), {
        headers: { 
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Database viewer HTML page
    if (url.pathname === "/db-view") {
      const entries = await this.storage.list();
      const data = Array.from(entries.values());
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Database Viewer</title>
          <style>
            body { font-family: Arial; margin: 40px; background: #f5f5f5; }
            table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #0078d4; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            tr:hover { background: #f0f0f0; }
            .stats { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .back-btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #0078d4; color: white; text-decoration: none; border-radius: 5px; }
            .empty { text-align: center; padding: 40px; color: #666; }
          </style>
        </head>
        <body>
          <h1>📊 Database Viewer</h1>
          <div class="stats">
            <strong>Total Records:</strong> ${data.length}
          </div>
          ${data.length > 0 ? `
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
          ` : '<div class="empty">No records found. Add some data first!</div>'}
          <a href="/" class="back-btn">← Back to Add Records</a>
        </body>
        </html>
      `;
      
      return new Response(html, { 
        headers: { 
          "content-type": "text/html",
          "Access-Control-Allow-Origin": "*"
        } 
      });
    }

    return new Response("Not found", { 
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
