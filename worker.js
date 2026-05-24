export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS for browser requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Get Durable Object
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // API routes
    if (url.pathname === "/add") {
      return obj.fetch(request);
    }

    if (url.pathname === "/list") {
      return obj.fetch(request);
    }

    // Return 404 for anything else
    return new Response("Not found - Worker API is at /add and /list endpoints", { 
      status: 404,
      headers: corsHeaders 
    });
  }
}

export class MyDatabase {
  constructor(state, env) {
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/add" && request.method === "POST") {
      const { name, email } = await request.json();
      await this.storage.put(name, { name, email });
      return new Response(JSON.stringify({ success: true, message: "Added successfully" }), {
        headers: corsHeaders
      });
    }

    if (url.pathname === "/list" && request.method === "GET") {
      const entries = await this.storage.list();
      const records = [];
      for (const [key, value] of entries) {
        records.push(value);
      }
      return new Response(JSON.stringify(records), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { 
      status: 404,
      headers: corsHeaders 
    });
  }
}
