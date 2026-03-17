const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeCNBB() {
    console.log("Iniciando captura da CNBB...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Camuflagem para evitar bloqueios de robôs
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');

    const dadosLiturgia = {
        data_captura: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        fonte: "CNBB",
        conteudo: ""
    };

    try {
        await page.goto('https://liturgia.cnbb.org.br/', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Extração complexa mirando o padrão de artigos da CNBB
        const textoLiturgia = await page.evaluate(() => {
            const container = document.querySelector('.liturgia, article, .entry-content');
            if (!container) return "Conteúdo não encontrado.";
            
            // Remove elementos desnecessários (scripts, ads, botões de redes sociais)
            container.querySelectorAll('script, style, .social-share, button, iframe').forEach(el => el.remove());
            
            return container.innerText.trim().replace(/\n\s*\n/g, '\n\n');
        });

        dadosLiturgia.conteudo = textoLiturgia;
        fs.writeFileSync('liturgia_cnbb.json', JSON.stringify(dadosLiturgia, null, 2));
        console.log("✅ Liturgia da CNBB salva com sucesso.");

    } catch (erro) {
        console.error("❌ Falha ao processar CNBB:", erro.message);
    } finally {
        await browser.close();
    }
}

scrapeCNBB();
