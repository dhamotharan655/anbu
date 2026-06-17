
import fs from 'fs';

function findMismatch(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let balance = 0;
    const lines = content.split('\n');
    let stack = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '{') {
                balance++;
                stack.push(i + 1);
            }
            if (char === '}') {
                balance--;
                stack.pop();
                if (balance < 0) {
                    console.log(`Extra closing brace at line ${i + 1}`);
                    balance = 0;
                }
            }
        }
    }

    if (balance > 0) {
        console.log(`Unclosed '{' on lines: ${stack.join(', ')}`);
    } else {
        console.log("Braces balanced.");
    }
}

findMismatch('i:/Client/Anbu/anbu_2/ruban_final3/ruban_final1.1/WaterFrontend/src/pages/Booking.jsx');
