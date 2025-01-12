import { Jimp, loadFont } from "jimp";
import { SANS_16_WHITE } from "jimp/fonts";

export async function processImage() {
  try {
    const image = await Jimp.read("screen.png");

    const left = 50;
    const right = 350;
    const top = 80;
    const bottom = 150;

    const croppedWidth = Math.max(1, image.bitmap.width - left - right);
    const croppedHeight = Math.max(1, image.bitmap.height - top - bottom);

    const croppedImage = image.crop({
      x: left,
      y: top,
      w: croppedWidth,
      h: croppedHeight,
    });

    const font = await loadFont(SANS_16_WHITE);

    const watermarkText = "© CRYPTO_SIGNALS";

    const x = croppedImage.bitmap.width - 500;
    const y = croppedImage.bitmap.height - 100;

    croppedImage.print({ font, x, y, text: watermarkText });

    await croppedImage.write("screen.png");

    console.log("Изображение успешно обработано.");
  } catch (error) {
    console.error("Ошибка при обработке изображения:", error);
  }
}
