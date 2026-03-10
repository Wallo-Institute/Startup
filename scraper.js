import fs from 'fs';

const API_KEY = process.env.LIS_API_KEY;
const MOCK_MODE = !API_KEY;

async function scrapeLaws() {
    if (MOCK_MODE) {
        console.log("Running in MOCK MODE");
        return;
    }

    try {
        // Updated to the 'Session/api' path discovered in your network log
        // We are targeting Title 1, for the 2024 Session, Chapter 1
        const url = 'https://lis.virginia.gov/Session/api/GetCodeSectionsAsync/1/2024/1';
        
        console.log(`Targeting Session API: ${url}`);
        
        const response = await fetch(url, {
            headers: { 
                'WebAPIKey': API_KEY,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://lis.virginia.gov/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();

        // If it still returns HTML, it's an IP block. If it's JSON, we win.
        if (text.trim().startsWith('<!doctype')) {
            console.error("FAIL: The Session API still redirected to an HTML page.");
            console.log("Snippet:", text.substring(0, 100));
            return;
        }

        const data = JSON.parse(text);
        console.log("SUCCESS! Data received from Session API.");

        // LIS Session API usually returns an array directly or inside 'ListItems'
        const items = Array.isArray(data) ? data : (data.ListItems || []);
        
        const laws = items.map(item => ({
            code: item.SectionNumber || "N/A",
            title: item.CatchLine || "No Title",
            description: item.SectionText ? item.SectionText.substring(0, 200) + "..." : ""
        }));

        if (!fs.existsSync('./docs')) { fs.mkdirSync('./docs'); }
        fs.writeFileSync('./docs/laws.json', JSON.stringify(laws, null, 2));
        console.log(`Successfully updated laws.json with ${laws.length} entries.`);

    } catch (err) {
        console.error("Scraper Error:", err.message);
    }
}

scrapeLaws();