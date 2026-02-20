import { spawn } from "child_process";

/**
 * Runs a shell command and streams output line by line.
 *
 * @param {string} command - The shell command to run
 * @param {object} opts
 * @param {string} [opts.cwd] - Working directory
 * @param {function} [opts.onStdout] - Called with each stdout line
 * @param {function} [opts.onStderr] - Called with each stderr line
 * @returns {Promise<number>} - Resolves with exit code
 *
 * @example
 * await runCommand("ls -la", {
 *     onStdout: (line) => console.log(line),
 *     onStderr: (line) => console.error(line),
 * });
 */
export function runCommand(command, { cwd, onStdout, onStderr } = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, {
            shell: true,
            cwd: cwd || process.cwd(),
        });

        proc.stdout.on("data", (chunk) => {
            for (const line of chunk.toString().split("\n")) {
                if (line) onStdout?.(line);
            }
        });

        proc.stderr.on("data", (chunk) => {
            for (const line of chunk.toString().split("\n")) {
                if (line) onStderr?.(line);
            }
        });

        proc.on("close", (code) => resolve(code));
        proc.on("error", (err) => reject(err));
        proc.stdin.on("error", () => {}); // swallow EPIPE
    });
}
