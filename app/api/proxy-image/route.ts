import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        console.log(`Proxying request for: ${url}`);
        const headers: HeadersInit = {};
        const authHeader = request.headers.get("Authorization");
        if (authHeader) {
            headers["Authorization"] = authHeader;
            console.log("Forwarding Authorization header");
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            const err = await response.text();
            console.error(`Upstream Error ${response.status}:`, err);
            // Return the same status code as the upstream
            return NextResponse.json(
                { error: `Upstream error: ${err}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
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
