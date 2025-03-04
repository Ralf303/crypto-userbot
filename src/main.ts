import { html, TelegramClient } from "@mtcute/node";
import express from "express";
import cors from "cors";
import * as env from "./env.js";
import { chromium } from "playwright";
import { processImage } from "./jimp.util.js";
import axios from "axios";
import { createClient } from "redis";

export const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: "bot-data/session",
});

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis client error", err));
await redisClient.connect();

function getRandomTime() {
  const currentTime = new Date();
  const randomMinutes = Math.floor(Math.random() * 5) + 2;

  currentTime.setHours(currentTime.getHours() + 2);
  currentTime.setMinutes(currentTime.getMinutes() + randomMinutes);

  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

const start = async () => {
  try {
    const app = express();
    const user = await tg.start();

    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.post("/", async (req, res) => {
      try {
        const data = req.body;
        const price = data?.price;
        const direct = data?.direct;
        const pare = data?.pare;

        if (!price || !direct || !pare) {
          res.status(200).send("Invalid data");
          return;
        }
        res.send("OK");

        const time = getRandomTime();
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const isWithinTimeFrame = hour >= 6 && hour <= 22;

        if (price && direct && isWeekday && isWithinTimeFrame) {
          const browser = await chromium.launch({ headless: true });
          const context = await browser.newContext();

          await context.addCookies([
            {
              name: "sessionid",
              value: "k0xeo0fhdvg6vhinechfq884rfy59yto",
              domain: ".tradingview.com",
              path: "/",
            },
            {
              name: "sessionid_sign",
              value: "v3:egBZYK6lKg3FYDL7CDsgoRvqHoM4ydpIJGXnLlUrKdE=",
              domain: ".tradingview.com",
              path: "/",
            },
          ]);

          const page = await context.newPage();

          console.log("Регаемся");

          await page.goto("https://www.tradingview.com/chart/Sop2oITN", {
            timeout: 60000,
          });
          console.log("Регнулись");

          await page.getByRole("button", { name: "Change symbol" }).click();
          await page.waitForTimeout(1000);
          await page.getByPlaceholder("Search").fill(pare);
          await page.waitForTimeout(4000);
          await page.getByTitle("FXCM").click();
          await page.waitForTimeout(2000);

          await page.getByRole("button", { name: "Fullscreen mode" }).click();
          await page.waitForTimeout(1000);
          await page.getByText("Accept all").click();
          // await page.getByTitle("Hide indicators legend").click();
          await page.waitForTimeout(2000);

          await page.screenshot({
            path: "screen.png",
            fullPage: true,
          });
          await processImage();
          console.log("Скриншот");

          const file = await tg.uploadFile({ file: "./screen.png" });

          await tg.sendMedia(env.CANNEL_ID, {
            type: "photo",
            file: file,
            caption: html`<emoji id="5812150667812280629">✅</emoji> Валютна пара: ${
              pare.substring(0, 3) + "/" + pare.substring(3)
            }<br />
            <emoji id="5870921681735781843">✅</emoji> Сигнал:
            <strong
            >${direct === "UP" ? "ВВЕРХ" : "ВНИЗ"}</strong><emoji id="${
              direct === "UP" ? "5963103826075456248" : "6039802767931871481"
            }">${direct === "UP" ? "⬆️" : "✅"}</emoji><br />
              <emoji id="5776356023820358695">✅</emoji> Цена актива: ${price}<br />
              <emoji id="5983150113483134607">✅</emoji> Сделку открываем до ${time}</strong
            ><br /><br /><emoji id="5938195768832692153">✅</emoji> Анализ проведен при помощи искусственного интеллекта а также кластерным анализом`,
          });
          // Сохраняем данные в Redis
          await redisClient.set(
            `signal:${time}`,
            JSON.stringify({ direct, price, pare })
          );
          await browser.close();
        }

        return;
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the request.");
      }
    });

    // Проверяем сигналы по расписанию
    setInterval(async () => {
      const currentTime = new Date();

      currentTime.setHours(currentTime.getHours() + 2);
      currentTime.setMinutes(currentTime.getMinutes());

      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");

      const signal = await redisClient.get(`signal:${hours}:${minutes}`);
      if (signal) {
        const { direct, price, pare } = JSON.parse(signal);
        const cryptPrice = await axios.get(
          `https://quotes.instaforex.com/api/quotesTick?q=${pare}`
        );

        const { ask } = cryptPrice.data[0];

        const resultImage =
          direct === "UP"
            ? ask > price
              ? "./images/up.jpg"
              : "./images/down.jpg"
            : ask < price
            ? "./images/up.jpg"
            : "./images/down.jpg";

        const emojiId =
          direct === "UP"
            ? ask > price
              ? "5427009714745517609"
              : "5465665476971471368"
            : ask < price
            ? "5427009714745517609"
            : "5465665476971471368";

        const emoji =
          direct === "UP"
            ? ask > price
              ? "✅"
              : "❌"
            : ask < price
            ? "✅"
            : "❌";

        const status =
          direct === "UP"
            ? ask > price
              ? "ПРОФИТ"
              : "УБЫТОК"
            : ask < price
            ? "ПРОФИТ"
            : "УБЫТОК";

        const fileResult = await tg.uploadFile({ file: resultImage });

        await tg.sendMedia(env.CANNEL_ID, {
          type: "photo",
          file: fileResult,
          caption: html`<emoji id="5812150667812280629">✅</emoji> Валютна пара:
            ${pare.substring(0, 3) + "/" + pare.substring(3)}<br />
            <emoji id="5954226188804164973">✅</emoji> Цена открытия: ${price}
            <br />
            <emoji id="5954226188804164973">✅</emoji> Цена закрытия: ${ask}<br />
            <br />
            <emoji id=${emojiId}>${emoji}</emoji>
            Результат прогноза: ${status}<br />
            <br />
            <emoji id="5938195768832692153">✅</emoji> Анализ проведен при
            помощи искусственного интеллекта а также кластерным анализом`,
        });

        await redisClient.del(`signal:${hours}:${minutes}`);
      }
    }, 45000); // Проверяем каждую минуту

    app.get("/", (_: any, res: any) => {
      res.send("BOT WORKING");
    });

    console.log("Logged in as", user.username);

    app.listen(5000, async () => {
      console.log("Server is running on port 5000");
    });
  } catch (error) {
    console.error(error);
  }
};

start();
