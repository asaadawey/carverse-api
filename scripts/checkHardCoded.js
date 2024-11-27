const { execSync } = require('child_process');
const { readFileSync } = require('fs');

function getChangedFiles(extension = '') {

    const command = `git diff --cached --name-only -- "*.${extension}"`;
    const diffOutput = execSync(command).toString();

    return diffOutput.toString().split('\n').filter(Boolean);
}

function main() {
    const files = getChangedFiles("ts");

    for (let file of files) {
        // Exculde test files
        if (!file.includes(".spec.") && !file.includes(".test.")) {
            const contents = readFileSync(`${file}`).toString();
            if (contents.includes("http://") || contents.includes("https://")) {
                console.log("Found secured values at " + file + "\n")
                process.exit(1);
            }
        }
    }
    console.log(process.argv)
}
main()