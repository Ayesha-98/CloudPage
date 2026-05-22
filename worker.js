export default {
  async fetch(request, env) {
    // Handle CORS preflight requests FIRST
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // Database viewer endpoint
    if (url.pathname === "/db-view") {
      return obj.fetch(request);
    }

    // Forward all other routes to Durable Object
    return obj.fetch(request);
  }
}

export class MyDatabase {
  constructor(state, env) {
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle CORS for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (url.pathname === "/add" && request.method === "POST") {
      try {
        const { name, email } = await request.json();
        await this.storage.put(name, { name, email });
        return new Response(JSON.stringify({ success: true, message: "Added successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/list") {
      try {
        const entries = await this.storage.list();
        const data = Array.from(entries.values());
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Database viewer HTML page
    if (url.pathname === "/db-view") {
      try {
        const entries = await this.storage.list();
        const data = Array.from(entries.values());
        
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Database Viewer</title>
  <style>
    body { font-family: Arial; margin: 40px; background: #f5f5f5; }
    table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #0078d4; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .stats { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .back-btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #0078d4; color: white; text-decoration: none; border-radius: 5px; }
    .empty { text-align: center; padding: 40px; color: #666; }
  </style>
</head>
<body>
  <h1>📊 Database Viewer</h1>
  <div class="stats"><strong>Total Records:</strong> ${data.length}</div>
  ${data.length > 0 ? `
    <table>
      <tr><th>#</th><th>Name</th><th>Email</th></tr>
      ${data.map((record, index) => `
        <tr><td>${index + 1}</td><td>${record.name || 'N/A'}</td><td>${record.email || 'N/A'}</td></tr>
      `).join('')}
    </table>
  ` : '<div class="empty">No records found. Add some data first!</div>'}
  <a href="https://cloudpage-7k2.pages.dev" class="back-btn">← Back to Add Records</a>
</body>
</html>`;
        
        return new Response(html, { 
          headers: { ...corsHeaders, "Content-Type": "text/html" } 
        });
      } catch (error) {
        return new Response("Error loading database", { 
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("Not found", { 
      status: 404,
      headers: corsHeaders
    });
  }
}
