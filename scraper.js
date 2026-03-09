import fs from 'fs';

// SET TO 'true' to test without an API key
const MOCK_MODE = true; 

async function scrapeLaws() {
    console.log("🚀 Starting Virginia Law Scraper...");
    
    let laws = [];

    if (MOCK_MODE) {
        console.log("⚠️ Running in MOCK MODE (using dummy data)");
        laws = [
            { code: "§ 1.1-1", title: "The Mock Statute", description: "This is a test entry to ensure your website displays data correctly." },
            { code: "§ 8.01-1", title: "Civil Procedure Test", description: "Another test entry for the Virginia Law portal." }
        ];
    } else {
        const API_KEY = 'YOUR_KEY_HERE';
        try {
            const response = await fetch('https://lis.virginia.gov/api/v1/code-sections', {
                headers: { 'WebAPIKey': API_KEY }
            });
            const data = await response.json();
            laws = data.ListItems.map(item => ({
                code: item.SectionNumber,
                title: item.CatchLine,
                description: item.SectionText.substring(0, 200) + "..."
            }));
        } catch (err) {
            console.error("❌ API Fetch failed:", err.message);
            return;
        }
    }

    // Save to the docs folder so the website can see it
    fs.writeFileSync('./docs/laws.json', JSON.stringify(laws, null, 2));
    console.log("✅ Success! docs/laws.json has been updated.");
}

scrapeLaws();