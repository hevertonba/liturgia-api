const puppeteer = require('puppeteer');
const fs = require('fs');

async function vaticanScraper() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.vaticannews.va/pt/oracoes.html', { waitUntil: 'networkidle2' });

        const dadosVaticano = await page.evaluate(() => {
            // 1. Pega uma frase aleatória do carrossel de citações
            const frases = Array.from(document.querySelectorAll('.prayer_slide')).map(el => el.innerText);
            const fraseDoDia = frases[Math.floor(Math.random() * frases.length)];

            // 2. Pega o link do áudio das Laudes (primeiro player da página)
            const audioLink = document.querySelector('audio source')?.src || "";

            return {
                frase: fraseDoDia,
                audio: audioLink,
                atualizado: new Date().toISOString()
            };
        });

        fs.writeFileSync('vaticano_hoje.json', JSON.stringify(dadosVaticano, null, 2));
        console.log("Dados do Vaticano capturados!");

    } catch (e) {
        console.error("Erro no Vaticano:", e);
    }
    await browser.close();
}
vaticanScraper();
