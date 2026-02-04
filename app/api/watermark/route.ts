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

        console.log(`Processing watermark for: ${imageFile.name}, size: ${imageFile.size} bytes`);

        // Parse Config
        const config = JSON.parse(configString) as WatermarkConfig;

        // Convert Files to Buffers
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        
        // Validate image buffer
        if (imageBuffer.length === 0) {
            console.error("Empty image buffer received");
            return NextResponse.json(
                { error: "Empty image file" },
                { status: 400 }
            );
        }

        let logoBuffer: Buffer | undefined;

        if (logoFile) {
            logoBuffer = Buffer.from(await logoFile.arrayBuffer());
        }

        // Process
        const processedImageBuffer = await processWatermark(imageBuffer, config, logoBuffer);

        console.log(`Successfully processed ${imageFile.name}`);

        // Return Image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new NextResponse(processedImageBuffer as any, {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="watermarked-${imageFile.name}.png"`,
            },
        });
    } catch (error) {
        console.error("Watermark processing error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error details:", errorMessage);
        return NextResponse.json(
            { error: `Failed to process image: ${errorMessage}` },
            { status: 500 }
        );
    }
}
