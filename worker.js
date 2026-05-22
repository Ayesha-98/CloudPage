export default {
  async fetch(request, env) {
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // OPTIONS request for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Insert Data into Database
    if (request.method === "POST") {
      try {
        const data = await request.json();

        const { name, email } = data;

        // Insert query
        await env.DB.prepare(
          `INSERT INTO users (name, email) VALUES (?, ?)`
        )
          .bind(name, email)
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Data stored successfully",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    // Fetch all users
    if (request.method === "GET") {
      const result = await env.DB.prepare(
        `SELECT * FROM users`
      ).all();

      return new Response(JSON.stringify(result.results), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  },
};
