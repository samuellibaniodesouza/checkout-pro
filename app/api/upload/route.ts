import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_IMAGE_DATA_URL_BYTES = 2.5 * 1024 * 1024;

function getSafeExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /*
      Railway não mantém uploads locais de forma confiável entre deploys.
      Para CAPAS/IMAGENS pequenas, salvamos como Data URL no banco via imageUrl.
      Assim a imagem cadastrada pelo painel continua funcionando na web sem depender da pasta public/uploads.
    */
    if (file.type.startsWith("image/")) {
      if (buffer.byteLength > MAX_IMAGE_DATA_URL_BYTES) {
        return NextResponse.json(
          {
            error:
              "Imagem muito grande. Envie uma capa menor, de preferência WEBP/JPG até 2,5 MB.",
          },
          { status: 400 }
        );
      }

      const base64 = buffer.toString("base64");

      return NextResponse.json({
        url: `data:${file.type};base64,${base64}`,
        storage: "database",
      });
    }

    /*
      Arquivos maiores, como PDFs, continuam usando o modo antigo.
      Para produção 100% profissional, o próximo passo é trocar isto por Cloudinary/Supabase/S3.
    */
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const fileExtension = getSafeExtension(file.name);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExtension}`;

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${fileName}`,
      storage: "local",
    });
  } catch (error) {
    console.error("Erro no upload:", error);

    return NextResponse.json(
      { error: "Erro ao enviar arquivo." },
      { status: 500 }
    );
  }
}
