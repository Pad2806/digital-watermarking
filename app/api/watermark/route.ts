import { NextRequest, NextResponse } from "next/server";
import { processWatermark } from "@/lib/watermark-service";
import { WatermarkConfig } from "@/lib/watermark-types";

// Standard Route Handler
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get("image") as File | null;
        const configString = formData.get("config") as string | null;
        const logoFile = formData.get("logo") as File | null;

        if (!imageFile || !configString) {
            return NextResponse.json(
                { error: "Missing image or config" },
                { status: 400 }
            );
        }

        // Parse Config
        const config = JSON.parse(configString) as WatermarkConfig;

        // Convert Files to Buffers
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        let logoBuffer: Buffer | undefined;

        if (logoFile) {
            logoBuffer = Buffer.from(await logoFile.arrayBuffer());
        }

        // Process
        const processedImageBuffer = await processWatermark(imageBuffer, config, logoBuffer);

        // Return Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new NextResponse(processedImageBuffer as any, {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="watermarked.png"`,
            },
        });
    } catch (error) {
        console.error("Watermark processing error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
