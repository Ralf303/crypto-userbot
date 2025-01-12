import { Jimp, loadFont } from "jimp";
import { SANS_64_WHITE } from "jimp/fonts";

export async function processImage() {
  try {
    const image = await Jimp.read("screen.png");

    const left = 0;
    const right = 0;
    const top = 0;
    const bottom = 100;

    const croppedWidth = Math.max(1, image.bitmap.width - left - right);
    const croppedHeight = Math.max(1, image.bitmap.height - top - bottom);

    const croppedImage = image.crop({
      x: left,
      y: top,
      w: croppedWidth,
      h: croppedHeight,
    });

    const font = await loadFont(SANS_64_WHITE);

    const watermarkText = "© RT AI TRADE";

    const x = croppedImage.bitmap.width - 500;
    const y = croppedImage.bitmap.height - 100;

    image.print({ font, x, y, text: watermarkText });

    await image.write("screen.png");

    console.log("Изображение успешно обработано.");
  } catch (error) {
    console.error("Ошибка при обработке изображения:", error);
  }
}
