const puppeteer = require('puppeteer');
const fs = require('fs');

async function capturar() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/116.0.0.0 Safari/537.36');

    const dados = { 
        ultima_atualizacao: new Date().toLocaleDateString('pt-BR'),
        titulo: "Liturgia das Horas - " + new Date().toLocaleDateString('pt-BR'),
        horas: {} 
    };

    try {
        await page.goto('https://liturgiadashoras.online/', { waitUntil: 'domcontentloaded' });
        
        const linksDoDia = await page.evaluate(() => {
            const urls = { oficio: '', laudes: '', terca: '', sexta: '', nona: '', vesperas: '', completas: '' };
            const links = document.querySelectorAll('h2 a, h3 a, article a, .entry-title a');
            links.forEach(link => {
                const texto = link.innerText.toLowerCase();
                const url = link.href;
                if (url.includes('liturgiadashoras.online') && !url.includes('category')) {
                    if (texto.includes('ofício das leituras')) urls.oficio = url;
                    else if (texto.includes('laudes')) urls.laudes = url;
                    else if (texto.includes('hora terça')) urls.terca = url;
                    else if (texto.includes('hora sexta')) urls.sexta = url;
                    else if (texto.includes('hora nona')) urls.nona = url;
                    else if (texto.includes('vésperas')) urls.vesperas = url;
                    else if (texto.includes('completas')) urls.completas = url;
                }
            });
            return urls;
        });

        for (const [hora, url] of Object.entries(linksDoDia)) {
            if (!url) continue;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            let texto = await page.evaluate(() => {
                let container = document.querySelector('.entry-content') || document.querySelector('article');
                if (!container) return "";
                container.querySelectorAll('script, style, ins, .adsbygoogle, div.code-block').forEach(el => el.remove());
                return container.innerText;
            });
            dados.horas[hora] = texto.trim().replace(/\n\s*\n/g, '\n\n');
        }
    } catch (e) { console.error(e); }

    await browser.close();
    fs.writeFileSync('liturgia_hoje.json', JSON.stringify(dados, null, 2));
}
capturar();
