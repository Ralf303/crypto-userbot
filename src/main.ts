import { html, TelegramClient } from "@mtcute/node";
import express from "express";
import cors from "cors";
import * as env from "./env.js";
import { chromium } from "playwright";
import { processImage } from "./jimp.util.js";
import { getRandomTime } from "./utils.js";
import axios from "axios";

export const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: "bot-data/session",
});

function waitForTime(targetTime: any) {
  const now: any = new Date();
  const target: any = new Date(now.toDateString() + " " + targetTime);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target - now;

  return new Promise((resolve) => setTimeout(resolve, delay));
}

const start = async () => {
  try {
    const app = express();
    const user = await tg.start();

    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.post("/", async (req: any, res: any) => {
      try {
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

        await page.goto("https://www.tradingview.com/chart/Sop2oITN", {
          timeout: 60000,
        });

        await page.getByRole("button", { name: "Fullscreen mode" }).click();
        await page.waitForTimeout(1000);
        await page.getByText("Accept all").click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: "screen.png",
          fullPage: true,
        });
        await processImage();

        await browser.close();
        const data = req.body;
        const price = data?.price;
        const direct = data?.direct;
        const time = getRandomTime();

        if (price && direct) {
          const file = await tg.uploadFile({ file: "./screen.png" });
          await tg.sendMedia(-1002301555153, {
            type: "photo",
            file: file,
            caption: html`<emoji id="5812150667812280629">✅</emoji> Валютна пара: EUR/USD<br />
          <emoji id="5870921681735781843">✅</emoji> Сигнал:
          <strong
            >${direct === "UP" ? "ВВЕРХ" : "ВНИЗ"}</strong><emoji id="${
              direct === "UP" ? "5963103826075456248" : "6039802767931871481"
            }">${direct === "UP" ? "⬆️" : "✅"}</emoji><br />
            <emoji id="5776356023820358695">✅</emoji> Цена актива: ${price}<br />
            <emoji id="5983150113483134607">✅</emoji> Сделку открываем до ${time}</strong
          ><br /><br /><emoji id="5938195768832692153">✅</emoji> Анализ проведен с помощью GPT TRADE AI 5.0,RT TRADE AI 2.0 а также индикаторами технического анализа`,
          });

          await waitForTime(time);

          const cryptPrice = await axios.get(
            "https://min-api.cryptocompare.com/data/price?fsym=EUR&tsyms=USD"
          );
          const { USD } = cryptPrice.data;

          if (direct === "UP") {
            if (price > USD) {
              await tg.sendText(
                -1002301555153,
                html`<emoji id="5812150667812280629">✅</emoji> Валютна пара:
                  EUR/USD<br />
                  <emoji id="5954226188804164973">✅</emoji>Цена открытия:
                  ${price} <br /><emoji id="5954226188804164973">✅</emoji>Цена
                  закрытия: ${USD}<br /><br /><emoji id="5980930633298350051"
                    >✅</emoji
                  >Результат прогноза: ПРОФИТ<br /><br /><emoji
                    id="5938195768832692153"
                    >✅</emoji
                  >
                  Анализ проведен с помощью GPT TRADE AI 5.0,RT TRADE AI 2.0 а
                  также индикаторами технического анализа`
              );
            } else {
              await tg.sendText(
                -1002301555153,
                html`<emoji id="5812150667812280629">✅</emoji> Валютна пара:
                  EUR/USD<br />
                  <emoji id="5954226188804164973">✅</emoji>Цена открытия:
                  ${price} <br /><emoji id="5954226188804164973">✅</emoji>Цена
                  закрытия: ${USD}<br /><br /><emoji id="5980930633298350051"
                    >✅</emoji
                  >Результат прогноза: НЕПРОФИТ<br /><br /><emoji
                    id="5938195768832692153"
                    >✅</emoji
                  >
                  Анализ проведен с помощью GPT TRADE AI 5.0,RT TRADE AI 2.0 а
                  также индикаторами технического анализа`
              );
            }
          } else if (direct === "DOWN") {
            if (price < USD) {
              await tg.sendText(
                -1002301555153,
                html`<emoji id="5812150667812280629">✅</emoji> Валютна пара:
                  EUR/USD<br />
                  <emoji id="5954226188804164973">✅</emoji>Цена открытия:
                  ${price} <br /><emoji id="5954226188804164973">✅</emoji>Цена
                  закрытия: ${USD}<br /><br /><emoji id="5980930633298350051"
                    >✅</emoji
                  >Результат прогноза: ПРОФИТ<br /><br /><emoji
                    id="5938195768832692153"
                    >✅</emoji
                  >
                  Анализ проведен с помощью GPT TRADE AI 5.0,RT TRADE AI 2.0 а
                  также индикаторами технического анализа`
              );
            } else {
              await tg.sendText(
                -1002301555153,
                html`<emoji id="5812150667812280629">✅</emoji> Валютна пара:
                  EUR/USD<br />
                  <emoji id="5954226188804164973">✅</emoji>Цена открытия:
                  ${price} <br /><emoji id="5954226188804164973">✅</emoji>Цена
                  закрытия: ${USD}<br /><br /><emoji id="5980930633298350051"
                    >✅</emoji
                  >Результат прогноза: НЕПРОФИТ<br /><br /><emoji
                    id="5938195768832692153"
                    >✅</emoji
                  >
                  Анализ проведен с помощью GPT TRADE AI 5.0,RT TRADE AI 2.0 а
                  также индикаторами технического анализа`
              );
            }
          }
        }
        res.send("OK");
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing the request.");
      }
    });

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
