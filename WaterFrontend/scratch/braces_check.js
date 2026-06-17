
import fs from 'fs';

function checkBraces(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let balance = 0;
    let line = 1;
    let lastUnbalanced = 0;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '\n') line++;
        if (char === '{') balance++;
        if (char === '}') balance--;

        if (balance < 0) {
            console.log(`Unbalanced closing brace at line ${line}`);
            balance = 0; // reset to keep checking
        }
    }

    if (balance > 0) {
        console.log(`Unopened braces remaining: ${balance}`);
    } else if (balance === 0) {
        console.log("Braces are balanced.");
    }
}

console.log("Checking Booking.jsx:");
checkBraces('i:/Client/Anbu/anbu_2/ruban_final3/ruban_final1.1/WaterFrontend/src/pages/Booking.jsx');

console.log("\nChecking StockManagement.jsx:");
checkBraces('i:/Client/Anbu/anbu_2/ruban_final3/ruban_final1.1/WaterFrontend/src/pages/StockManagement/StockManagement.jsx');
