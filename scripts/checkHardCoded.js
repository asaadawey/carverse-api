import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const exclusion = ['src/index.ts', 'src/utils/cors.ts']

function getChangedFiles(extension = '') {

    const command = `git diff --diff-filter=ACM --cached --name-only -- "*.${extension}"`;
    const diffOutput = execSync(command).toString();

    return diffOutput.toString().split('\n').filter(Boolean);
}

function main() {
    const files = getChangedFiles("ts");

    for (let file of files) {
        // Exculde test files
        if (!file.includes(".spec.") && !file.includes(".test.") && !exclusion.includes(file)) {
            const contents = readFileSync(`${file}`).toString();
            if (contents.includes("http://") || contents.includes("https://")) {
                console.log("Found secured values at " + file + "\n")
                process.exit(1);
            }
        }
    }
}
main()