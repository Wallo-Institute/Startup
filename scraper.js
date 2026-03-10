import fs from 'fs';

// It now checks the Environment Variable you set in GitHub Actions
const API_KEY = process.env.LIS_API_KEY;
const MOCK_MODE = !API_KEY; // If no key is found, it defaults to Mock Mode

async function scrapeLaws() {
    console.log(MOCK_MODE ? "Running in MOCK MODE" : "Running with Live API Key");
    
    // Safety check: print the first 4 characters of the key to verify it exists
    if (API_KEY) {
        console.log(`Key detected: ${API_KEY.substring(0, 4)}****`);
    }

    let laws = [];

    if (MOCK_MODE) {
        laws = [
            { code: "§ 1.1-1", title: "The Mock Statute", description: "Test entry for Wallo Institute." },
            { code: "§ 8.01-1", title: "Civil Procedure Test", description: "Another test entry." }
        ];
    } else {
        try {
            const response = await fetch('https://lis.virginia.gov/api/v1/code-sections', {
                headers: { 
                    'WebAPIKey': API_KEY,
                    'User-Agent': 'Wallo-Institute-Law-Scraper/1.0'
                }
            });

            // If the response isn't JSON, this will catch the HTML error page
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("The API returned HTML instead of JSON. Check if the API key is valid or if the service is down.");
                return;
            }

            // Mapping the LIS data to your specific JSON format
            if (data.ListItems) {
                laws = data.ListItems.map(item => ({
                    code: item.SectionNumber,
                    title: item.CatchLine,
                    description: item.SectionText ? item.SectionText.substring(0, 200) + "..." : "No description available."
                }));
            }
        } catch (err) {
            console.error("API Fetch failed:", err.message);
            return;
        }
    }

    // Ensure the directory exists before writing
    if (!fs.existsSync('./docs')) { 
        fs.mkdirSync('./docs'); 
    }
    
    fs.writeFileSync('./docs/laws.json', JSON.stringify(laws, null, 2));
    console.log(`Success! docs/laws.json has been updated with ${laws.length} entries.`);
}

scrapeLaws();