import fs from 'fs';

const API_KEY = process.env.LIS_API_KEY;
const MOCK_MODE = !API_KEY;

async function scrapeLaws() {
    console.log(MOCK_MODE ? "Running in MOCK MODE" : "Running with Live API Key");
    
    let laws = [];

    if (MOCK_MODE) {
        laws = [{ code: "§ 1-1", title: "Mock", description: "Mock data." }];
    } else {
        try {
            // TARGETING A SPECIFIC CHAPTER (Title 1) 
            // This is more likely to work than asking for the whole database
            const url = 'https://lis.virginia.gov/api/v1/code-sections?title=1';
            
            console.log(`Fetching: ${url}`);
            
            const response = await fetch(url, {
                headers: { 
                    'WebAPIKey': API_KEY,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WalloBot/1.0',
                    'Accept': 'application/json'
                }
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            
            const text = await response.text();
            
            if (text.includes('<!doctype') || text.includes('<html')) {
                console.error("BLOCK DETECTED: The server sent back a webpage/firewall block.");
                console.log("Response starts with:", text.substring(0, 100));
                return;
            }

            const data = JSON.parse(text);
            if (data.ListItems) {
                laws = data.ListItems.map(item => ({
                    code: item.SectionNumber,
                    title: item.CatchLine,
                    description: item.SectionText ? item.SectionText.substring(0, 200) + "..." : ""
                }));
            }
        } catch (err) {
            console.error("CRITICAL ERROR:", err.message);
            return;
        }
    }

    if (!fs.existsSync('./docs')) { fs.mkdirSync('./docs'); }
    fs.writeFileSync('./docs/laws.json', JSON.stringify(laws, null, 2));
    console.log(`Successfully wrote ${laws.length} laws to docs/laws.json`);
}

scrapeLaws();