const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeVaticano() {
    console.log("Iniciando captura do Vatican News...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.vaticannews.va/pt/oracoes.html', { waitUntil: 'networkidle2', timeout: 60000 });

        const dadosVaticano = await page.evaluate(() => {
            const data = {
                data_captura: new Date().toISOString(),
                frases_papa: [],
                audios_liturgicos: [],
                oracoes_lista: []
            };

            // 1. Captura todas as frases do Papa no carrossel
            document.querySelectorAll('.prayer_slide').forEach(slide => {
                if(slide.innerText) data.frases_papa.push(slide.innerText.trim());
            });

            // 2. Captura os players de áudio (Laudes, Vésperas, Completas)
            document.querySelectorAll('.teaser--type-audio').forEach(audioBlock => {
                const titulo = audioBlock.querySelector('.teaser__title span')?.innerText || "Áudio";
                const url = audioBlock.querySelector('audio source')?.src || "";
                if (url) data.audios_liturgicos.push({ titulo, url });
            });

            // 3. Mapeia a lista de orações clássicas
            document.querySelectorAll('.teaser--type-prayer a').forEach(link => {
                const nome = link.title;
                const url = link.href;
                if (nome && !data.oracoes_lista.some(o => o.nome === nome)) {
                    data.oracoes_lista.push({ nome, url });
                }
            });

            return data;
        });

        // Escolhe uma frase aleatória para ser o destaque do dia
        dadosVaticano.frase_do_dia = dadosVaticano.frases_papa[Math.floor(Math.random() * dadosVaticano.frases_papa.length)];

        fs.writeFileSync('vaticano_dados.json', JSON.stringify(dadosVaticano, null, 2));
        console.log("✅ Dados do Vaticano salvos com sucesso.");

    } catch (erro) {
        console.error("❌ Falha ao processar Vaticano:", erro.message);
    } finally {
        await browser.close();
    }
}

scrapeVaticano();
