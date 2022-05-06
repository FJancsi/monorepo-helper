import packageFile from "./package.json" assert { type: "json" };
import readline from "node:readline";
import { readFile, writeFile } from "fs/promises";
import { stdin as input, stdout as output } from "node:process";
import { exec } from "node:child_process";
import path from "path";
import ora from "ora";
import chalk from "chalk";
const log = console.log;
const { projects } = packageFile;

const listProjects = () => {
    log(`All projects: ${chalk.green(Object.keys(projects))}`);
};

const logCommandExecution = ({
                                 hasFailed,
                                 projectName,
                                 projectPath,
                                 fileName,
                             }) => {
    const reportMessage = () =>
        fileName
            ? ` and report can be found at ${chalk.underline(
                projectPath + "/" + fileName
            )}`
            : "";
    const logMessage = `on ${chalk.italic(projectName)}${reportMessage()}`;

    hasFailed ? log(chalk.red(logMessage)) : log(chalk.green(logMessage));
};

const runCommand =
    ({ command, logSdt = false, fileName = "" }) =>
        (projects) => {
            const spinner = ora().start(`Running ${command} `);
            for (let project in projects) {
                exec(
                    command,
                    { cwd: `${process.cwd()}/${projects[project]}/` },
                    (error, stdout, stderr) => {
                        if (error) {
                            spinner.fail(`${chalk.bgCyan(command)} has finished with issues`);
                            logCommandExecution({
                                hasFailed: true,
                                projectName: project,
                                projectPath: projects[project],
                                fileName,
                            });
                            logSdt && log(chalk.red(error));
                            return;
                        }
                        if (stderr) {
                            spinner.fail(`${chalk.bgCyan(command)} has finished with issues`);
                            logCommandExecution({
                                hasFailed: true,
                                projectName: project,
                                projectPath: projects[project],
                                fileName,
                            });
                            logSdt && log(chalk.red(stderr));
                            return;
                        }
                        spinner.succeed(
                            `${chalk.bgCyan(command)} has finished without issues`
                        );
                        logCommandExecution({
                            hasFailed: false,
                            projectName: project,
                            projectPath: projects[project],
                            fileName,
                        });
                        logSdt && log(chalk.green(stdout));
                    }
                );
            }
        };

const runNPMAudit = (projects) => {
    runCommand({ command: "npm audit > audit.txt", fileName: "audit.txt" })(
        projects
    );
};

const runNPMOutdated = (projects) => {
    runCommand({
        command: "npm outdated > outdated.txt",
        fileName: "outdated.txt",
    })(projects);
};

const runNPMUpdate = (projects) => {
    runCommand({ command: "npm update --save", logSdt: true })(projects);
};

const runNPMInstall = (projects) => {
    runCommand({ command: "npm install", logSdt: true })(projects);
};

const runUpdateEngine = (projects) => async (param) => {
    const spinner = ora().start(`Updating node engine `);
    for (let project in projects) {
        try {
            const pathToFile = path.join(
                process.cwd(),
                `${projects[project]}/package.json`
            );
            const packageFile = await readFile(pathToFile, "utf8");
            const packageData = JSON.parse(packageFile);
            const [node, npm] = param.split(",");
            packageData.engines = { node, npm };
            await writeFile(pathToFile, JSON.stringify(packageData, null, 2), {
                encoding: "utf8",
            });
            spinner.succeed(
                `Updating node engines at ${pathToFile} has been finished!`
            );
        } catch (error) {
            spinner.fail(`Error during updating node engines ${error} !`);
        }
    }
};

const questions = {
    npmAudit: "Would you like to run NPM audit? (y/n) ",
    npmOutdated: "Would you like to search for outdated dependencies? (y/n) ",
    npmUpdate:
        "Would you like to update the npm dependencies automatically? (y/n) ",
    updateEngine:
        "New engine versions:  ([node, npm] eg.:>=16.0.0, >=8.0.0 or leave empty to skip) ",
    npmInstall: "Would you like to run NPM install? (y/n) ",
};

const commands = {
    npmAudit: () => runNPMAudit(projects),
    npmOutdated: () => runNPMOutdated(projects),
    npmUpdate: () => runNPMUpdate(projects),
    updateEngine: (param) => runUpdateEngine(projects)(param),
    npmInstall: () => runNPMInstall(projects),
};

const askQuestion = (rl, question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const ask = (questions) => {
    return new Promise(async (resolve) => {
        const rl = readline.createInterface({
            input,
            output,
        });
        const answers = {};
        for (let question in questions) {
            answers[question] = await askQuestion(rl, questions[question]);
        }
        rl.close();
        resolve(answers);
    });
};

const main = async (questions) => {
    try {
        listProjects();

        const answers = await ask(questions);

        for (let answer in answers) {
            const decision = answers[answer];
            if (decision && decision.toLowerCase() !== "n") {
                commands[answer](decision);
            }
        }
    } catch (error) {
        log(chalk.red(`Something went wrong: ${error}`));
    }
};

await main(questions);
