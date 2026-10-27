// Stops early with a clear message when Node.js is too old for this project.
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`\nGaach needs Node.js 20 or newer, but this computer has ${process.version}.`);
  console.error("Download the LTS version from https://nodejs.org, install it, then open a new terminal and try again.\n");
  process.exit(1);
}
