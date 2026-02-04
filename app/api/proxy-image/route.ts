import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        console.log(`Proxying request for: ${url}`);
        const headers: HeadersInit = {
            // Add user agent to avoid some API blocks
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        };
        
        const authHeader = request.headers.get("Authorization");
        if (authHeader) {
            headers["Authorization"] = authHeader;
            console.log("Forwarding Authorization header");
        }

        // For Google APIs, the access token might already be in the URL
        // So we don't need to modify the URL, just forward the request
        const response = await fetch(url, { 
            headers,
            // Add cache and redirect options
            cache: 'no-store',
            redirect: 'follow'
        });
        if (!response.ok) {
            const err = await response.text();
            console.error(`Upstream Error ${response.status}:`, err);
            console.error(`Failed URL:`, url);
            
            // Parse error message if it's JSON
            let errorMessage = err;
            try {
                const errorJson = JSON.parse(err);
                errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
            } catch {}
            
            // Return the same status code as the upstream
            return NextResponse.json(
                { error: `Upstream error: ${errorMessage}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        
        // Check if we got HTML instead of an image
        if (contentType.includes("text/html")) {
            console.error("Received HTML instead of image");
            return NextResponse.json(
                { error: "Server returned HTML instead of image. The file might not be accessible or the API key/token is invalid." },
                { status: 400 }
            );
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Proxy exception:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
